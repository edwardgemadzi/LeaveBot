import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';
import { rateLimiters } from '../shared/rate-limiter.js';
import { logger } from '../shared/logger.js';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Rate limiting for read operations
  const rateLimit = rateLimiters.read(req);
  Object.entries(rateLimit.headers || {}).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded', { endpoint: '/api/users/index', ip: req.headers['x-forwarded-for'] });
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

  } catch (error) {
    logger.error('Error in users/index', { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
