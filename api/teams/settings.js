import jwt from 'jsonwebtoken';
import { JWT_SECRET, connectToDatabase } from '../shared/mongodb-storage.js';
import { logger } from '../shared/logger.js';
import { rateLimiters } from '../shared/rate-limiter.js';
import { ObjectId } from 'mongodb';

// Authentication middleware
function authenticateToken(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return { authenticated: false, error: 'Authentication required' };
  }
  
  try {
    const user = jwt.verify(token, JWT_SECRET);
    return { authenticated: true, user };
  } catch (err) {
    return { authenticated: false, error: 'Invalid or expired token' };
  }
}

export default async function handler(req, res) {
  const startTime = Date.now();
  
  // Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // Rate limiting
  const rateLimit = req.method === 'GET' ? rateLimiters.read(req) : rateLimiters.mutation(req);
  Object.entries(rateLimit.headers || {}).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded', { 
      endpoint: '/api/teams/settings', 
      method: req.method, 
      ip: req.headers['x-forwarded-for'] 
    });
    return res.status(429).json({ error: rateLimit.message });
  }
  
  // Authentication
  const auth = authenticateToken(req);
  if (!auth.authenticated) {
    return res.status(401).json({ error: auth.error });
  }

  // Only leaders can access team settings
  if (auth.user.role !== 'leader' && auth.user.role !== 'admin') {
    logger.warn('Non-leader attempted to access team settings', { 
      userId: auth.user.id, 
      role: auth.user.role 
    });
    return res.status(403).json({ 
      error: 'Only team leaders can access team settings' 
    });
  }

  const { db } = await connectToDatabase();
  const teamsCollection = db.collection('teams');

  // GET - Get team settings
  if (req.method === 'GET') {
    try {
      // Find the team where this user is the leader
      let team;
      
      if (auth.user.role === 'leader') {
        team = await teamsCollection.findOne({ leaderId: new ObjectId(auth.user.id) });
        
        if (!team) {
          logger.warn('Leader has no assigned team', { userId: auth.user.id });
          return res.status(404).json({ 
            error: 'You are not assigned to any team. Please contact an administrator.' 
          });
        }
      } else if (auth.user.role === 'admin') {
        // For admins, we'll need to specify which team (for now, just return default)
        team = { settings: {} };
      }

      const settings = team.settings || {
        annualLeaveDays: 21,
        maxConsecutiveDays: 14,
        minAdvanceNoticeDays: 7,
        allowNegativeBalance: false,
        carryOverDays: 5
      };

      logger.info('Team settings retrieved', {
        userId: auth.user.id,
        teamId: team._id?.toString(),
        duration: Date.now() - startTime
      });

      return res.json({ 
        success: true, 
        settings 
      });
    } catch (err) {
      logger.error('Error fetching team settings', { 
        error: err.message, 
        userId: auth.user.id 
      });
      return res.status(500).json({ error: 'Failed to fetch team settings' });
    }
  }

  // PUT - Update team settings
  if (req.method === 'PUT') {
    try {
      const {
        annualLeaveDays,
        maxConsecutiveDays,
        minAdvanceNoticeDays,
        allowNegativeBalance,
        carryOverDays
      } = req.body;

      // Validate input
      if (annualLeaveDays !== undefined && (annualLeaveDays < 0 || annualLeaveDays > 365)) {
        return res.status(400).json({ error: 'Annual leave days must be between 0 and 365' });
      }
      if (maxConsecutiveDays !== undefined && (maxConsecutiveDays < 1 || maxConsecutiveDays > 90)) {
        return res.status(400).json({ error: 'Maximum consecutive days must be between 1 and 90' });
      }
      if (minAdvanceNoticeDays !== undefined && (minAdvanceNoticeDays < 0 || minAdvanceNoticeDays > 90)) {
        return res.status(400).json({ error: 'Minimum advance notice must be between 0 and 90 days' });
      }
      if (carryOverDays !== undefined && (carryOverDays < 0 || carryOverDays > 30)) {
        return res.status(400).json({ error: 'Carry over days must be between 0 and 30' });
      }

      // Find the team where this user is the leader
      let team;
      
      if (auth.user.role === 'leader') {
        team = await teamsCollection.findOne({ leaderId: new ObjectId(auth.user.id) });
        
        if (!team) {
          return res.status(404).json({ 
            error: 'You are not assigned to any team. Please contact an administrator.' 
          });
        }
      } else {
        return res.status(403).json({ 
          error: 'Admins cannot update team settings directly. Please use team management.' 
        });
      }

      const newSettings = {
        annualLeaveDays: annualLeaveDays ?? 21,
        maxConsecutiveDays: maxConsecutiveDays ?? 14,
        minAdvanceNoticeDays: minAdvanceNoticeDays ?? 7,
        allowNegativeBalance: allowNegativeBalance ?? false,
        carryOverDays: carryOverDays ?? 5,
        updatedAt: new Date(),
        updatedBy: auth.user.id
      };

      const result = await teamsCollection.updateOne(
        { _id: team._id },
        { $set: { settings: newSettings } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Team not found' });
      }

      logger.info('Team settings updated', {
        userId: auth.user.id,
        teamId: team._id.toString(),
        settings: newSettings,
        duration: Date.now() - startTime
      });

      return res.json({ 
        success: true, 
        message: 'Team settings updated successfully',
        settings: newSettings
      });
    } catch (err) {
      logger.error('Error updating team settings', { 
        error: err.message, 
        userId: auth.user.id 
      });
      return res.status(500).json({ error: 'Failed to update team settings' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
