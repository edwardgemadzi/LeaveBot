import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, addUser, getUserByUsername, initializeAdmin } from '../lib/shared/mongodb-storage.js';
import { rateLimiters } from '../lib/shared/rate-limiter.js';
import { logger } from '../lib/shared/logger.js';
import { validateUsername, validatePassword, validateName } from '../lib/shared/validators.js';

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

  const { username, password, name, teamId } = req.body;
  
  // Validate inputs using validators
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    return res.status(400).json({ error: usernameValidation.error });
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ error: passwordValidation.error });
  }

  const nameValidation = validateName(name, false);
  const validName = nameValidation.valid ? nameValidation.value : usernameValidation.value;
  
  // Check if user already exists
  const existingUser = await getUserByUsername(usernameValidation.value);
  if (existingUser) {
    logger.warn('Registration attempt with existing username', { username: usernameValidation.value });
    return res.status(409).json({ error: 'Username already exists' });
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(passwordValidation.value, 10);
  
  // Create user using helper (will auto-assign admin if first user)
  const userData = {
    username: usernameValidation.value,
    passwordHash,
    name: validName
  };
  
  // Add teamId if provided
  if (teamId) {
    const { ObjectId } = await import('mongodb');
    userData.teamId = new ObjectId(teamId);
    
    // Apply team default settings if available
    try {
      const { connectToDatabase } = await import('./shared/mongodb-storage.js');
      const { db } = await connectToDatabase();
      const team = await db.collection('teams').findOne({ _id: userData.teamId });
      
      if (team?.settings?.defaults) {
        userData.settings = team.settings.defaults;
        logger.info('Applied team default settings to new user', { 
          username: usernameValidation.value, 
          teamId: teamId 
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
  
  const newUser = await addUser(userData);
  
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
