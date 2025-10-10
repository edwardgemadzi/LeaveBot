import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, addUser, getUserByUsername, initializeAdmin, connectToDatabase } from '../lib/shared/mongodb-storage.js';
import { rateLimiters } from '../lib/shared/rate-limiter.js';
import { logger } from '../lib/shared/logger.js';
import { validateUsername, validatePassword, validateName } from '../lib/shared/validators.js';
import { getDefaultTeamSettings } from '../lib/shared/working-days.js';

// Initialize admin on cold start
initializeAdmin();

export default async function handler(req, res) {
  const startTime = Date.now();
  
  // Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limiting
  const rateLimit = rateLimiters.mutation(req);
  Object.entries(rateLimit.headers || {}).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded for registration', { ip: req.headers['x-forwarded-for'] });
    return res.status(429).json({ error: rateLimit.message });
  }

  const { username, password, name, role = 'user', teamId, teamToken, teamName } = req.body;
  
  // Validate inputs using validators
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
  
  // Handle team token validation for regular user registration
  let resolvedTeamId = teamId;
  if (teamToken) {
    try {
      const decodedToken = jwt.verify(teamToken, JWT_SECRET);
      
      // Validate token type and structure
      if (decodedToken.type !== 'team_registration' || !decodedToken.teamId) {
        return res.status(400).json({ error: 'Invalid team token format' });
      }
      
      // Use team ID from token
      resolvedTeamId = decodedToken.teamId;
      
      logger.info('Team token validated for registration', { 
        username: usernameValidation.value,
        teamId: resolvedTeamId,
        teamName: decodedToken.teamName 
      });
    } catch (tokenError) {
      logger.warn('Invalid team token provided', { 
        username: usernameValidation.value,
        error: tokenError.message 
      });
      return res.status(400).json({ error: 'Invalid or expired team token' });
    }
  }

  // Handle team creation for leaders
  let resolvedTeamId = teamId;
  if (role === 'leader') {
    if (!teamName || teamName.trim().length === 0) {
      return res.status(400).json({ error: 'Team name is required for team leaders' });
    }

    try {
      // Connect to database and get teams collection
      const client = await connectToDatabase();
      const db = client.db('leavebot');
      const teamsCollection = db.collection('teams');

      // Check if team name already exists
      const existingTeam = await teamsCollection.findOne({ name: teamName.trim() });
      if (existingTeam) {
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
      resolvedTeamId = teamResult.insertedId;

      logger.info('Team created for new leader during registration', {
        teamId: resolvedTeamId.toString(),
        teamName: teamName.trim(),
        leaderName: validName
      });
    } catch (teamError) {
      logger.error('Error creating team for leader', {
        error: teamError.message,
        teamName: teamName.trim(),
        leaderName: validName
      });
      return res.status(500).json({ error: 'Failed to create team' });
    }
  }
  
  // Check if user already exists
  const existingUserResult = await getUserByUsername(usernameValidation.value);
  if (existingUserResult.success && existingUserResult.data) {
    logger.warn('Registration attempt with existing username', { username: usernameValidation.value });
    return res.status(409).json({ success: false, error: 'Username already exists' });
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(passwordValidation.value, 10);
  
  // Create user using helper (will auto-assign admin if first user)
  const userData = {
    username: usernameValidation.value,
    passwordHash,
    name: validName,
    role: role
  };
  
  // Add teamId if provided (from direct assignment or team token)
  if (resolvedTeamId) {
    const { ObjectId } = await import('mongodb');
    userData.teamId = new ObjectId(resolvedTeamId);
    
    // Apply team default settings if available
    try {
      const { db } = await connectToDatabase();
      const team = await db.collection('teams').findOne({ _id: userData.teamId });
      
      if (team?.settings?.defaults) {
        userData.settings = team.settings.defaults;
        logger.info('Applied team default settings to new user', { 
          username: usernameValidation.value, 
          teamId: resolvedTeamId 
        });
      }
    } catch (error) {
      logger.warn('Failed to apply team defaults during registration', { 
        error: error.message, 
        teamId 
      });
      // Don't fail registration if settings fetch fails
    }
  }
  
  const newUserResult = await addUser(userData);
  
  if (!newUserResult.success) {
    logger.error('Failed to create user', { error: newUserResult.error });
    return res.status(500).json({ success: false, error: 'Failed to create user account' });
  }

  const newUser = newUserResult.data;
  
  // Handle team assignment for leaders
  if (role === 'leader' && resolvedTeamId) {
    try {
      const { ObjectId } = await import('mongodb');
      const client = await connectToDatabase();
      const db = client.db('leavebot');
      const teamsCollection = db.collection('teams');
      
      await teamsCollection.updateOne(
        { _id: new ObjectId(resolvedTeamId) },
        { 
          $set: { 
            leaderId: newUser._id,
            updatedAt: new Date()
          }
        }
      );
      
      logger.info('Leader assigned to team', {
        userId: newUser._id.toString(),
        teamId: resolvedTeamId.toString(),
        teamName: teamName.trim()
      });
    } catch (error) {
      logger.error('Failed to assign leader to team', {
        error: error.message,
        userId: newUser._id.toString(),
        teamId: resolvedTeamId.toString()
      });
      // Don't fail registration if team assignment fails
    }
  }
  
  // Generate JWT token
  const token = jwt.sign(
    { 
      id: newUser._id.toString(), 
      username: newUser.username, 
      role: newUser.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  logger.info('User registered successfully', { 
    username: newUser.username, 
    role: newUser.role, 
    ip: req.headers['x-forwarded-for'] 
  });

  const duration = Date.now() - startTime;
  logger.response(req, res, duration);

  return res.json({
    success: true,
    user: { 
      id: newUser._id.toString(), 
      username: newUser.username, 
      name: newUser.name, 
      role: newUser.role 
    },
    token,
    message: newUser.role === 'admin' ? 'First user created as admin' : 'User registered successfully'
  });
}
