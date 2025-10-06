const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
let cachedClient = null;

async function connectDB() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!['admin', 'leader'].includes(decoded.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { username, password, name, role } = req.body;
    
    if (!username || !password || !name || !role) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    if (decoded.role === 'leader' && role === 'admin') {
      return res.status(403).json({ success: false, error: 'Leaders cannot create admins' });
    }

    const client = await connectDB();
    const db = client.db('leavebot');
    const usersCollection = db.collection('users');

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

  } catch (error) {
    console.error('Error in users/create:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
