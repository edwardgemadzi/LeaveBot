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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { username, password, name, role = 'user', teamName } = req.body;

    // Validate inputs
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return res.status(400).json({ error: usernameValidation.error });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    // Validate role
    if (!['user', 'leader'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user" or "leader"' });
    }

    const nameValidation = validateName(name, false);
    const validName = nameValidation.valid ? nameValidation.value : usernameValidation.value;

    // Handle team creation for leaders
    let teamId = null;
    if (role === 'leader') {
      if (!teamName || teamName.trim().length === 0) {
        return res.status(400).json({ error: 'Team name is required for team leaders' });
      }

      const client = await connectDB();
      const db = client.db('leavebot');
      const teamsCollection = db.collection('teams');

      // Check if team name already exists
      const existingTeam = await teamsCollection.findOne({ name: teamName.trim() });
      if (existingTeam) {
        await client.close();
        return res.status(400).json({ error: 'Team name already exists' });
      }

      // Create new team for the leader
      const newTeam = {
        name: teamName.trim(),
        description: `Team managed by ${validName}`,
        leaderId: null, // Will be set after user creation
        members: [],
        settings: getDefaultTeamSettings(),
        createdAt: new Date()
      };

      const teamResult = await teamsCollection.insertOne(newTeam);
      teamId = teamResult.insertedId;

      await client.close();

      logger.info('Team created for new leader during registration', {
        teamId: teamId.toString(),
        teamName: teamName.trim(),
        leaderName: validName
      });
    }

    // Check if user already exists
    const client = await connectDB();
    const db = client.db('leavebot');
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ username: usernameValidation.value });
    if (existingUser) {
      await client.close();
      return res.status(409).json({ success: false, error: 'Username already exists' });
    }

    // Create user
    const passwordHash = await bcrypt.hash(passwordValidation.value, 10);
    const newUser = {
      username: usernameValidation.value,
      passwordHash,
      name: validName,
      role: role,
      teamId: teamId,
      createdAt: new Date()
    };

    const userResult = await usersCollection.insertOne(newUser);
    const createdUser = { _id: userResult.insertedId, ...newUser };

    // Update team if this is a leader
    if (role === 'leader' && teamId) {
      const teamsCollection = db.collection('teams');
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

    await client.close();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: createdUser._id.toString(), 
        username: createdUser.username, 
        role: createdUser.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const duration = Date.now() - startTime;
    logger.info('User registered successfully', {
      username: createdUser.username,
      role: createdUser.role,
      duration
    });

    return res.status(201).json({
      success: true,
      token,
      user: {
        ...createdUser,
        id: createdUser._id.toString()
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Registration error', { 
      error: error.message, 
      stack: error.stack,
      duration 
    });
    return res.status(500).json({ success: false, error: 'Registration failed' });
  }
}
