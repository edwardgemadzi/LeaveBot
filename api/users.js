import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MongoClient, ObjectId } from 'mongodb';
import { logger } from '../lib/shared/logger.js';
import { validateUsername, validatePassword, validateName } from '../lib/shared/validators.js';
import { getDefaultTeamSettings } from '../lib/shared/working-days.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

async function connectDB() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client;
}

export default async function handler(req, res) {
  const startTime = Date.now();
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract auth token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }

  // Only admins and leaders can access this endpoint
  if (!['admin', 'leader'].includes(decoded.role)) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  try {
    const client = await connectDB();
    const db = client.db('leavebot');
    const usersCollection = db.collection('users');
    const teamsCollection = db.collection('teams');

    if (req.method === 'GET') {
      // List users based on role
      let query = {};
      
      if (decoded.role === 'leader') {
        // Leaders can only see users in their team
        const leaderTeam = await teamsCollection.findOne({ leaderId: new ObjectId(decoded.id) });
        if (leaderTeam) {
          query = { teamId: leaderTeam._id };
        } else {
          return res.status(400).json({ success: false, error: 'Leader not assigned to any team' });
        }
      }
      // Admins can see all users

      const users = await usersCollection.find(query).toArray();
      const usersWithIds = users.map(user => ({
        ...user,
        id: user._id.toString()
      }));

      await client.close();
      return res.status(200).json({ success: true, users: usersWithIds });
    }

    if (req.method === 'POST') {
      // Create user
      const { username, password, name, role, teamName } = req.body;

      // Validate inputs
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        return res.status(400).json({ success: false, error: usernameValidation.error });
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ success: false, error: passwordValidation.error });
      }

      const nameValidation = validateName(name);
      if (!nameValidation.valid) {
        return res.status(400).json({ success: false, error: nameValidation.error });
      }

      // Validate role
      if (!['user', 'leader'].includes(role)) {
        return res.status(400).json({ success: false, error: 'Invalid role' });
      }

      // Check permissions
      if (decoded.role === 'leader' && role !== 'user') {
        return res.status(403).json({ success: false, error: 'Leaders can only create team members' });
      }

      // Check if username exists
      const existing = await usersCollection.findOne({ username: usernameValidation.value });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Username already exists' });
      }

      // Determine team assignment
      let teamId = null;

      if (role === 'leader') {
        // Create new team for leader
        if (!teamName || teamName.trim().length === 0) {
          return res.status(400).json({ success: false, error: 'Team name is required for team leaders' });
        }

        // Check if team name exists
        const existingTeam = await teamsCollection.findOne({ name: teamName.trim() });
        if (existingTeam) {
          return res.status(400).json({ success: false, error: 'Team name already exists' });
        }

        // Create team
        const newTeam = {
          name: teamName.trim(),
          description: `Team managed by ${nameValidation.value}`,
          leaderId: null, // Will be set after user creation
          members: [],
          settings: getDefaultTeamSettings(),
          createdAt: new Date()
        };

        const teamResult = await teamsCollection.insertOne(newTeam);
        teamId = teamResult.insertedId;
      } else if (role === 'user') {
        // Assign user to leader's team
        if (decoded.role === 'leader') {
          const leaderTeam = await teamsCollection.findOne({ leaderId: new ObjectId(decoded.id) });
          if (leaderTeam) {
            teamId = leaderTeam._id;
          } else {
            return res.status(400).json({ success: false, error: 'Leader not assigned to any team' });
          }
        }
        // If admin creates user, they can specify teamId in request body
        // For now, we'll require teamId for admin-created users
      }

      // Create user
      const passwordHash = await bcrypt.hash(passwordValidation.value, 10);
      const newUser = {
        username: usernameValidation.value,
        passwordHash,
        name: nameValidation.value,
        role: role,
        teamId: teamId,
        createdAt: new Date()
      };

      const userResult = await usersCollection.insertOne(newUser);
      const createdUser = { _id: userResult.insertedId, ...newUser };

      // Update team if this is a leader
      if (role === 'leader' && teamId) {
        await teamsCollection.updateOne(
          { _id: teamId },
          { 
            $set: { 
              leaderId: userResult.insertedId,
              updatedAt: new Date()
            }
          }
        );
      }

      // Add user to team members if they're a regular user
      if (role === 'user' && teamId) {
        await teamsCollection.updateOne(
          { _id: teamId },
          { 
            $addToSet: { members: userResult.insertedId },
            $set: { updatedAt: new Date() }
          }
        );
      }

      await client.close();

      logger.info('User created successfully', {
        userId: userResult.insertedId.toString(),
        username: usernameValidation.value,
        role: role,
        teamId: teamId?.toString()
      });

      return res.status(201).json({ 
        success: true, 
        user: {
          ...createdUser,
          id: createdUser._id.toString()
        }
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    logger.error('Error in users API', { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
