import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { MongoClient, ObjectId } from 'mongodb';
import { rateLimiters } from './shared/rate-limiter.js';
import { logger } from './shared/logger.js';
import { validateUsername, validatePassword, validateName, validateRole, validateObjectId } from './shared/validators.js';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if this is a password change request (has action=password query param)
    const { action } = req.query;

    // POST /api/users?action=password - Change password
    if (req.method === 'POST' && action === 'password') {
      return await handlePasswordChange(req, res, decoded, startTime);
    }

    // POST /api/users?action=create - Create user
    if (req.method === 'POST' && action === 'create') {
      return await handleCreateUser(req, res, decoded, startTime);
    }

    // GET /api/users - List users
    if (req.method === 'GET') {
      return await handleListUsers(req, res, decoded, startTime);
    }

    return res.status(400).json({ success: false, error: 'Invalid action' });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    logger.error('Error in users endpoint', { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// Handler for listing users (GET /api/users)
async function handleListUsers(req, res, decoded, startTime) {
  // Rate limiting for read operations
  const rateLimit = rateLimiters.read(req);
  Object.entries(rateLimit.headers || {}).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded', { endpoint: '/api/users', action: 'list', ip: req.headers['x-forwarded-for'] });
    return res.status(429).json({ success: false, error: rateLimit.message });
  }

  if (!['admin', 'leader'].includes(decoded.role)) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  const client = await connectDB();
  const db = client.db('leavebot');
  let users = await db.collection('users').find({}).toArray();
  
  if (decoded.role === 'leader') {
    users = users.filter(u => u.role !== 'admin');
  }
  
  const safeUsers = users.map(({ passwordHash, ...user }) => ({
    ...user,
    id: user._id.toString()
  }));

  const duration = Date.now() - startTime;
  logger.response(req, res, duration, { userCount: safeUsers.length });
  
  return res.status(200).json({ success: true, users: safeUsers });
}

// Handler for creating users (POST /api/users?action=create)
async function handleCreateUser(req, res, decoded, startTime) {
  // Rate limiting for mutations
  const rateLimit = rateLimiters.mutation(req);
  Object.entries(rateLimit.headers || {}).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded', { endpoint: '/api/users', action: 'create', ip: req.headers['x-forwarded-for'] });
    return res.status(429).json({ success: false, error: rateLimit.message });
  }

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
}

// Handler for password changes (POST /api/users?action=password)
async function handlePasswordChange(req, res, decoded, startTime) {
  // Rate limiting for mutations
  const rateLimit = rateLimiters.mutation(req);
  Object.entries(rateLimit.headers || {}).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded', { endpoint: '/api/users', action: 'password', ip: req.headers['x-forwarded-for'] });
    return res.status(429).json({ success: false, error: rateLimit.message });
  }

  // Only admins can change user passwords
  if (decoded.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Only admins can change user passwords' });
  }

  const { userId, newPassword } = req.body;
  
  // Validate userId
  const userIdValidation = validateObjectId(userId);
  if (!userIdValidation.valid) {
    return res.status(400).json({ success: false, error: userIdValidation.error });
  }

  // Validate new password
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    return res.status(400).json({ success: false, error: passwordValidation.error });
  }

  const client = await connectDB();
  const db = client.db('leavebot');
  const usersCollection = db.collection('users');

  // Check if user exists
  const user = await usersCollection.findOne({ _id: new ObjectId(userIdValidation.value) });
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(passwordValidation.value, 10);

  // Update password
  await usersCollection.updateOne(
    { _id: new ObjectId(userIdValidation.value) },
    { 
      $set: { 
        passwordHash,
        updatedAt: new Date()
      } 
    }
  );

  logger.info('Password changed by admin', { 
    targetUser: user.username,
    changedBy: decoded.username,
    ip: req.headers['x-forwarded-for']
  });

  const duration = Date.now() - startTime;
  logger.response(req, res, duration);

  return res.status(200).json({ 
    success: true, 
    message: 'Password updated successfully'
  });
}
