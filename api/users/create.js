import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';
import { rateLimiters } from '../shared/rate-limiter.js';
import { logger } from '../shared/logger.js';
import { validateUsername, validatePassword, validateName, validateRole } from '../shared/validators.js';

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

export default async function handler(req, res) {
  const startTime = Date.now();
  
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

  // Rate limiting
  const rateLimit = rateLimiters.mutation(req);
  Object.entries(rateLimit.headers || {}).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded', { endpoint: '/api/users/create', ip: req.headers['x-forwarded-for'] });
    return res.status(429).json({ success: false, error: rateLimit.message });
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

    const roleValidation = validateRole(role);
    if (!roleValidation.valid) {
      return res.status(400).json({ success: false, error: roleValidation.error });
    }

    if (decoded.role === 'leader' && role === 'admin') {
      return res.status(403).json({ success: false, error: 'Leaders cannot create admins' });
    }

    const client = await connectDB();
    const db = client.db('leavebot');
    const usersCollection = db.collection('users');

    const existing = await usersCollection.findOne({ username: usernameValidation.value });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(passwordValidation.value, 10);
    const result = await usersCollection.insertOne({
      username: usernameValidation.value,
      passwordHash,
      name: nameValidation.value,
      role: roleValidation.value,
      createdAt: new Date()
    });

    logger.info('User created', { 
      userId: result.insertedId.toString(), 
      username: usernameValidation.value, 
      role: roleValidation.value,
      createdBy: decoded.username 
    });

    const duration = Date.now() - startTime;
    logger.response(req, res, duration);

    return res.status(201).json({ 
      success: true, 
      user: { 
        id: result.insertedId.toString(), 
        username: usernameValidation.value, 
        name: nameValidation.value, 
        role: roleValidation.value 
      } 
    });

  } catch (error) {
    logger.error('Error in users/create', { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
