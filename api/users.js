const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

function authenticateAndAuthorize(req, requiredRoles = []) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized', status: 401 };
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
      return { error: 'Forbidden: Insufficient permissions', status: 403 };
    }
    
    return { user: decoded };
  } catch (err) {
    return { error: 'Invalid or expired token', status: 401 };
  }
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const auth = authenticateAndAuthorize(req, ['admin', 'leader']);
  
  if (auth.error) {
    return res.status(auth.status).json({ success: false, error: auth.error });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('leavebot');
    const usersCollection = db.collection('users');

    // GET - List all users or get specific user
    if (req.method === 'GET') {
      if (id) {
        const user = await usersCollection.findOne({ _id: new ObjectId(id) });
        if (!user) {
          return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        if (auth.user.role === 'leader' && user.role === 'admin') {
          return res.status(403).json({ success: false, error: 'Access denied' });
        }
        
        const { passwordHash, ...safeUser } = user;
        return res.status(200).json({ success: true, user: { ...safeUser, id: user._id.toString() } });
      } else {
        let users = await usersCollection.find({}).toArray();
        
        if (auth.user.role === 'leader') {
          users = users.filter(u => u.role !== 'admin');
        }
        
        const safeUsers = users.map(({ passwordHash, ...user }) => ({
          ...user,
          id: user._id.toString()
        }));
        
        return res.status(200).json({ success: true, users: safeUsers });
      }
    }

    // POST - Create new user
    if (req.method === 'POST') {
      const { username, password, name, role } = req.body;
      
      if (!username || !password || !name || !role) {
        return res.status(400).json({ success: false, error: 'All fields required' });
      }

      if (auth.user.role === 'leader' && role === 'admin') {
        return res.status(403).json({ success: false, error: 'Leaders cannot create admins' });
      }

      const existing = await usersCollection.findOne({ username });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Username already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const result = await usersCollection.insertOne({
        username,
        passwordHash,
        name,
        role,
        createdAt: new Date()
      });

      return res.status(201).json({ 
        success: true, 
        user: { id: result.insertedId.toString(), username, name, role } 
      });
    }

    // PUT - Update user
    if (req.method === 'PUT') {
      if (!id) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const updates = {};
      if (req.body.name) updates.name = req.body.name;
      if (req.body.role) {
        if (auth.user.role === 'leader' && req.body.role === 'admin') {
          return res.status(403).json({ success: false, error: 'Cannot promote to admin' });
        }
        updates.role = req.body.role;
      }
      if (req.body.password) {
        updates.passwordHash = await bcrypt.hash(req.body.password, 10);
      }

      updates.updatedAt = new Date();

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updates }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      return res.status(200).json({ success: true, message: 'User updated' });
    }

    // DELETE - Delete user
    if (req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      if (auth.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only admins can delete users' });
      }

      const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      return res.status(200).json({ success: true, message: 'User deleted' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('Error in users API:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
