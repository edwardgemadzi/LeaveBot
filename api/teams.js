const jwt = require('jsonwebtoken');
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

  const { id, action } = req.query;
  const auth = authenticateAndAuthorize(req, ['admin', 'leader']);
  
  if (auth.error) {
    return res.status(auth.status).json({ success: false, error: auth.error });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('leavebot');
    const teamsCollection = db.collection('teams');
    const usersCollection = db.collection('users');

    // GET - List all teams or get specific team
    if (req.method === 'GET') {
      if (id) {
        const team = await teamsCollection.findOne({ _id: new ObjectId(id) });
        if (!team) {
          return res.status(404).json({ success: false, error: 'Team not found' });
        }

        const members = await usersCollection.find({ 
          teamId: new ObjectId(id) 
        }).toArray();

        const safeMembers = members.map(({ passwordHash, ...user }) => ({
          ...user,
          id: user._id.toString()
        }));

        return res.status(200).json({
          success: true,
          team: {
            ...team,
            id: team._id.toString(),
            members: safeMembers
          }
        });
      } else {
        const teams = await teamsCollection.find({}).toArray();
        const teamsWithCount = await Promise.all(teams.map(async (team) => {
          const memberCount = await usersCollection.countDocuments({ teamId: team._id });
          return {
            ...team,
            id: team._id.toString(),
            memberCount
          };
        }));

        return res.status(200).json({ success: true, teams: teamsWithCount });
      }
    }

    // POST - Create team, assign user, or remove user
    if (req.method === 'POST') {
      // Assign user to team
      if (id && action === 'assign') {
        const { userId } = req.body;
        if (!userId) {
          return res.status(400).json({ success: false, error: 'User ID required' });
        }

        const result = await usersCollection.updateOne(
          { _id: new ObjectId(userId) },
          { $set: { teamId: new ObjectId(id), updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ success: false, error: 'User not found' });
        }

        return res.status(200).json({ success: true, message: 'User assigned to team' });
      }

      // Remove user from team
      if (id && action === 'remove') {
        const { userId } = req.body;
        if (!userId) {
          return res.status(400).json({ success: false, error: 'User ID required' });
        }

        const result = await usersCollection.updateOne(
          { _id: new ObjectId(userId) },
          { $unset: { teamId: '' }, $set: { updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ success: false, error: 'User not found' });
        }

        return res.status(200).json({ success: true, message: 'User removed from team' });
      }

      // Create new team
      const { name, leaderId } = req.body;
      if (!name || !leaderId) {
        return res.status(400).json({ success: false, error: 'Name and leader ID required' });
      }

      const result = await teamsCollection.insertOne({
        name,
        leaderId: new ObjectId(leaderId),
        createdAt: new Date()
      });

      return res.status(201).json({
        success: true,
        team: { id: result.insertedId.toString(), name, leaderId }
      });
    }

    // PUT - Update team
    if (req.method === 'PUT') {
      if (!id) {
        return res.status(400).json({ success: false, error: 'Team ID required' });
      }

      const updates = {};
      if (req.body.name) updates.name = req.body.name;
      if (req.body.leaderId) updates.leaderId = new ObjectId(req.body.leaderId);
      updates.updatedAt = new Date();

      const result = await teamsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updates }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, error: 'Team not found' });
      }

      return res.status(200).json({ success: true, message: 'Team updated' });
    }

    // DELETE - Delete team
    if (req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json({ success: false, error: 'Team ID required' });
      }

      if (auth.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only admins can delete teams' });
      }

      // Remove team from all users
      await usersCollection.updateMany(
        { teamId: new ObjectId(id) },
        { $unset: { teamId: '' } }
      );

      const result = await teamsCollection.deleteOne({ _id: new ObjectId(id) });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ success: false, error: 'Team not found' });
      }

      return res.status(200).json({ success: true, message: 'Team deleted' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('Error in teams API:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
