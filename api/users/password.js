import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { MongoClient, ObjectId } from 'mongodb';
import { rateLimiters } from '../shared/rate-limiter.js';
import { logger } from '../shared/logger.js';
import { validatePassword, validateObjectId } from '../shared/validators.js';

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
    logger.warn('Rate limit exceeded', { endpoint: '/api/users/password', ip: req.headers['x-forwarded-for'] });
    return res.status(429).json({ success: false, error: rateLimit.message });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
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

  } catch (error) {
    logger.error('Error in users/password', { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
