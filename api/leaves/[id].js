import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../lib/shared/mongodb-storage.js';
import { connectToDatabase } from '../../lib/shared/mongodb-storage.js';
import { ObjectId } from 'mongodb';
import { logger } from '../../lib/shared/logger.js';
import { rateLimiters } from '../../lib/shared/rate-limiter.js';

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

  // PUT - Update leave status (approve/reject)
  if (req.method === 'PUT') {
    // Only admins and leaders can approve/reject leaves
    if (auth.user.role !== 'admin' && auth.user.role !== 'leader') {
      logger.warn('Non-admin/leader attempted to update leave status', { 
        userId: auth.user.id, 
        role: auth.user.role 
      });
      return res.status(403).json({ 
        error: 'Only admins and team leaders can approve or reject leave requests' 
      });
    }

    const { status } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        error: 'Valid status (approved or rejected) is required' 
      });
    }

    try {
      const { db } = await connectToDatabase();
      const leavesCollection = db.collection('leaves');

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
    try {
      const { db } = await connectToDatabase();
      const leavesCollection = db.collection('leaves');
      
      // Get the leave to check permissions
      const leave = await leavesCollection.findOne({ _id: new ObjectId(leaveId) });
      
      if (!leave) {
        return res.status(404).json({ error: 'Leave request not found' });
      }
      
      // Admins and leaders can delete any leave
      // Users can only delete their own pending leaves
      const canDelete = auth.user.role === 'admin' || 
                       auth.user.role === 'leader' ||
                       (leave.userId === auth.user.id && leave.status === 'pending');
      
      if (!canDelete) {
        return res.status(403).json({ 
          error: 'You can only delete your own pending leave requests' 
        });
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
