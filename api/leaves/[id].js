import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { JWT_SECRET, connectToDatabase } from '../../lib/shared/mongodb-storage.js';
import { rateLimiters } from '../../lib/shared/rate-limiter.js';
import { logger } from '../../lib/shared/logger.js';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
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
      endpoint: `/api/leaves/${req.query.id}`, 
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
  
  const { id: leaveId } = req.query;
  
  if (!leaveId) {
    return res.status(400).json({ error: 'Leave ID is required' });
  }

  // PUT - Approve or reject a leave request
  if (req.method === 'PUT') {
    if (auth.user.role !== 'admin' && auth.user.role !== 'leader') {
      logger.warn('Unauthorized approval attempt', { 
        userId: auth.user.id, 
        role: auth.user.role 
      });
      return res.status(403).json({ 
        error: 'Only admins and team leaders can approve or reject leave requests' 
      });
    }

    const { status, overridePassword } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        error: 'Valid status (approved or rejected) is required' 
      });
    }

    try {
      const { db } = await connectToDatabase();
      const leavesCollection = db.collection('leaves');
      const teamsCollection = db.collection('teams');
      const usersCollection = db.collection('users');

      // Get the leave request details first
      const leave = await leavesCollection.findOne({ _id: new ObjectId(leaveId) });
      if (!leave) {
        return res.status(404).json({ error: 'Leave request not found' });
      }

      // Check concurrent leave limit if approving
      let requiresPasswordOverride = false;
      let concurrentWarning = null;

      if (status === 'approved') {
        // Get the user's team
        const requestingUser = await usersCollection.findOne({ _id: leave.userId });
        if (requestingUser?.teamId) {
          const team = await teamsCollection.findOne({ _id: requestingUser.teamId });
          
          if (team?.settings?.maxConcurrentLeave) {
            // Count overlapping approved leaves
            const overlappingLeaves = await leavesCollection.find({
              teamId: team._id,
              status: 'approved',
              _id: { $ne: leave._id }, // Exclude current leave
              startDate: { $lte: leave.endDate },
              endDate: { $gte: leave.startDate }
            }).toArray();

            const uniqueUsersOnLeave = new Set(overlappingLeaves.map(l => l.userId.toString()));
            const currentCount = uniqueUsersOnLeave.size;

            // Check if limit would be exceeded
            if (currentCount >= team.settings.maxConcurrentLeave) {
              requiresPasswordOverride = true;
              concurrentWarning = `⚠️ WARNING: Approving this leave will exceed the concurrent leave limit. Currently ${currentCount} out of ${team.settings.maxConcurrentLeave} team members are on leave during this period.`;
              
              // If password override is required but not provided, return warning
              if (!overridePassword) {
                logger.warn('Concurrent leave limit exceeded, password required', {
                  leaveId,
                  teamId: team._id.toString(),
                  currentCount,
                  limit: team.settings.maxConcurrentLeave,
                  requestedBy: auth.user.id
                });

                return res.status(409).json({
                  error: 'concurrent_limit_exceeded',
                  warning: concurrentWarning,
                  requiresPasswordOverride: true,
                  currentCount,
                  limit: team.settings.maxConcurrentLeave
                });
              }

              // Verify password if override is attempted
              if (overridePassword) {
                const bcrypt = await import('bcryptjs');
                const leader = await usersCollection.findOne({ _id: new ObjectId(auth.user.id) });
                
                const validPassword = await bcrypt.compare(overridePassword, leader.password);
                if (!validPassword) {
                  logger.warn('Invalid password for concurrent leave override', {
                    leaveId,
                    userId: auth.user.id
                  });
                  return res.status(401).json({ 
                    error: 'Invalid password. Override failed.' 
                  });
                }

                logger.info('Concurrent leave limit overridden with password', {
                  leaveId,
                  teamId: team._id.toString(),
                  overriddenBy: auth.user.id,
                  currentCount,
                  limit: team.settings.maxConcurrentLeave
                });
              }
            }
          }
        }
      }

      const result = await leavesCollection.updateOne(
        { _id: new ObjectId(leaveId) },
        { 
          $set: { 
            status, 
            updatedAt: new Date(), 
            updatedBy: auth.user.id 
          } 
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Leave request not found' });
      }

      logger.info('Leave status updated', {
        leaveId,
        status,
        updatedBy: auth.user.id,
        role: auth.user.role,
        duration: Date.now() - startTime
      });

      const duration = Date.now() - startTime;
      logger.response(req, res, duration);

      return res.json({ 
        success: true, 
        message: `Leave request ${status}` 
      });
    } catch (err) {
      logger.error('Error updating leave status', { 
        error: err.message, 
        leaveId 
      });
      return res.status(500).json({ error: 'Failed to update leave status' });
    }
  }

  // DELETE - Delete leave request
  if (req.method === 'DELETE') {
    // Only admins can delete leave requests
    if (auth.user.role !== 'admin') {
      logger.warn('Non-admin attempted to delete leave', { 
        userId: auth.user.id, 
        role: auth.user.role,
        leaveId 
      });
      return res.status(403).json({ 
        error: 'Only administrators can delete leave requests' 
      });
    }

    try {
      const { db } = await connectToDatabase();
      const leavesCollection = db.collection('leaves');
      
      // Get the leave to verify it exists
      const leave = await leavesCollection.findOne({ _id: new ObjectId(leaveId) });
      
      if (!leave) {
        return res.status(404).json({ error: 'Leave request not found' });
      }

      await leavesCollection.deleteOne({ _id: new ObjectId(leaveId) });

      logger.info('Leave deleted', {
        leaveId,
        deletedBy: auth.user.id,
        role: auth.user.role,
        duration: Date.now() - startTime
      });

      const duration = Date.now() - startTime;
      logger.response(req, res, duration);

      return res.json({ 
        success: true, 
        message: 'Leave request deleted successfully' 
      });
    } catch (err) {
      logger.error('Error deleting leave', { 
        error: err.message, 
        leaveId 
      });
      return res.status(500).json({ error: 'Failed to delete leave request' });
    }
  }

  // GET - Get specific leave details
  if (req.method === 'GET') {
    try {
      const { db } = await connectToDatabase();
      const leavesCollection = db.collection('leaves');
      
      const leave = await leavesCollection.findOne({ _id: new ObjectId(leaveId) });
      
      if (!leave) {
        return res.status(404).json({ error: 'Leave request not found' });
      }
      
      // Check permissions: admins/leaders see all, users see only their own
      if (auth.user.role !== 'admin' && 
          auth.user.role !== 'leader' && 
          leave.userId !== auth.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const duration = Date.now() - startTime;
      logger.response(req, res, duration);

      return res.json({ 
        success: true, 
        leave 
      });
    } catch (err) {
      logger.error('Error fetching leave', { 
        error: err.message, 
        leaveId 
      });
      return res.status(500).json({ error: 'Failed to fetch leave request' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
