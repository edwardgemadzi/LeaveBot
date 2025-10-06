import clientPromise from '../../lib/mongodb';
import { verifyToken } from '../../lib/auth';
import { rateLimiters } from './shared/rate-limiter.js';
import { logger } from './shared/logger.js';
import { validateObjectId, validateBalance } from './shared/validators.js';

export default async function handler(req, res) {
  const startTime = Date.now();
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rate limiting
  const rateLimit = req.method === 'GET' ? rateLimiters.read(req) : rateLimiters.mutation(req);
  Object.entries(rateLimit.headers || {}).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded', { endpoint: '/api/balance', ip: req.headers['x-forwarded-for'] });
    return res.status(429).json({ error: rateLimit.message });
  }

  // Verify authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const client = await clientPromise;
  const db = client.db('leavebot');

  if (req.method === 'GET') {
    // Get balance for a specific user and year
    const { userId, year } = req.query;
    
    if (!userId || !year) {
      return res.status(400).json({ error: 'userId and year are required' });
    }

    // Validate userId format
    const userIdValidation = validateObjectId(userId);
    if (!userIdValidation.valid) {
      return res.status(400).json({ error: userIdValidation.error });
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    try {
      const balance = await db.collection('balances').findOne({
        userId: userIdValidation.value,
        year: yearNum
      });

      if (!balance) {
        // Return default balance if none exists
        const defaultBalance = {
          userId: userIdValidation.value,
          year: yearNum,
          totalDays: 20, // Default 20 days per year
          usedDays: 0,
          pendingDays: 0,
          availableDays: 20
        };
        
        const duration = Date.now() - startTime;
        logger.response(req, res, duration, { userId: userIdValidation.value, year: yearNum, isDefault: true });
        
        return res.json({
          success: true,
          balance: defaultBalance
        });
      }

      // Calculate available days
      balance.availableDays = balance.totalDays - balance.usedDays - balance.pendingDays;

      const duration = Date.now() - startTime;
      logger.response(req, res, duration, { userId: userIdValidation.value, year: yearNum });

      return res.json({
        success: true,
        balance
      });
    } catch (error) {
      logger.error('Failed to fetch balance', { error: error.message, userId, year });
      return res.status(500).json({ error: 'Failed to fetch balance' });
    }
  }

  if (req.method === 'POST') {
    // Initialize or update balance
    const { userId, year, totalDays, usedDays, pendingDays } = req.body;

    // Only admins can modify balances directly
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can modify balances' });
    }

    if (!userId || !year) {
      return res.status(400).json({ error: 'userId and year are required' });
    }

    // Validate inputs
    const userIdValidation = validateObjectId(userId);
    if (!userIdValidation.valid) {
      return res.status(400).json({ error: userIdValidation.error });
    }

    const totalValidation = validateBalance(totalDays || 20);
    if (!totalValidation.valid) {
      return res.status(400).json({ error: `Total days: ${totalValidation.error}` });
    }

    const usedValidation = validateBalance(usedDays || 0);
    if (!usedValidation.valid) {
      return res.status(400).json({ error: `Used days: ${usedValidation.error}` });
    }

    const pendingValidation = validateBalance(pendingDays || 0);
    if (!pendingValidation.valid) {
      return res.status(400).json({ error: `Pending days: ${pendingValidation.error}` });
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    try {
      const balanceData = {
        userId: userIdValidation.value,
        year: yearNum,
        totalDays: totalValidation.value,
        usedDays: usedValidation.value,
        pendingDays: pendingValidation.value,
        updatedAt: new Date()
      };

      await db.collection('balances').updateOne(
        { userId: userIdValidation.value, year: yearNum },
        { $set: balanceData },
        { upsert: true }
      );

      balanceData.availableDays = balanceData.totalDays - balanceData.usedDays - balanceData.pendingDays;

      logger.info('Balance updated', { 
        userId: userIdValidation.value, 
        year: yearNum, 
        updatedBy: decoded.username 
      });

      const duration = Date.now() - startTime;
      logger.response(req, res, duration);

      return res.json({
        success: true,
        balance: balanceData
      });
    } catch (error) {
      logger.error('Failed to update balance', { error: error.message, userId, year });
      return res.status(500).json({ error: 'Failed to update balance' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
