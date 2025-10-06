import jwt from 'jsonwebtoken';
import { JWT_SECRET, getAllLeaves, addLeaveRequest } from './shared/mongodb-storage.js';
import { rateLimiters } from './shared/rate-limiter.js';
import { logger } from './shared/logger.js';
import { calculateWorkingDays, getDefaultTeamSettings } from './shared/working-days.js';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from './shared/mongodb-storage.js';

// Authentication middleware
function authenticateToken(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
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

// Input validation and sanitization
function validateLeaveRequest(data) {
  const { employeeName, startDate, endDate, reason } = data;
  
  if (!employeeName || !startDate || !endDate) {
    return { valid: false, error: 'Employee name, start date, and end date are required' };
  }
  
  // Sanitize inputs
  const sanitizedData = {
    employeeName: String(employeeName).trim().substring(0, 100),
    startDate: String(startDate).trim(),
    endDate: String(endDate).trim(),
    reason: String(reason || '').trim().substring(0, 500)
  };
  
  // Validate date formats
  const start = new Date(sanitizedData.startDate);
  const end = new Date(sanitizedData.endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  
  if (end < start) {
    return { valid: false, error: 'End date must be after start date' };
  }
  
  return { valid: true, data: sanitizedData };
}

export default async function handler(req, res) {
  const startTime = Date.now();
  
  // Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
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
    logger.warn('Rate limit exceeded', { endpoint: '/api/leaves', method: req.method, ip: req.headers['x-forwarded-for'] });
    return res.status(429).json({ error: rateLimit.message });
  }
  
  // Authenticate all requests
  const auth = authenticateToken(req);
  if (!auth.authenticated) {
    return res.status(401).json({ error: auth.error });
  }

  // Handle calculate action (POST /api/leaves?action=calculate)
  const url = new URL(req.url, `http://${req.headers.host}`);
  const action = url.searchParams.get('action');
  
  if (req.method === 'POST' && action === 'calculate') {
    const { startDate, endDate, userId } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    if (end < start) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    try {
      const { db } = await connectToDatabase();
      const usersCollection = db.collection('users');
      const teamsCollection = db.collection('teams');
      const leavesCollection = db.collection('leaves');

      // Get user's team and settings
      const targetUserId = userId || auth.user.id;
      const user = await usersCollection.findOne({ _id: new ObjectId(targetUserId) });
      
      let teamSettings = getDefaultTeamSettings();
      if (user?.teamId) {
        const team = await teamsCollection.findOne({ _id: user.teamId });
        if (team?.settings) {
          teamSettings = team.settings;
        }
      }

      // Calculate working days based on team settings
      const result = calculateWorkingDays(
        start,
        end,
        teamSettings.shiftPattern,
        teamSettings.workingDays
      );

      // Check concurrent leave limits if enabled
      let concurrentWarning = null;
      let concurrentCount = 0;
      
      if (teamSettings.concurrentLeave?.enabled && user?.teamId) {
        // Find overlapping leaves
        const overlappingLeaves = await leavesCollection.find({
          status: 'approved',
          $or: [
            { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
          ]
        }).toArray();

        // Filter by team
        const teamMembers = await usersCollection.find({ teamId: user.teamId }).toArray();
        const teamMemberIds = teamMembers.map(m => m._id.toString());
        
        const overlappingTeamLeaves = overlappingLeaves.filter(leave => 
          teamMemberIds.includes(leave.userId.toString())
        );

        concurrentCount = overlappingTeamLeaves.length;
        const limit = teamSettings.concurrentLeave.checkByShift 
          ? teamSettings.concurrentLeave.maxPerShift
          : teamSettings.concurrentLeave.maxPerTeam;

        if (concurrentCount >= limit) {
          concurrentWarning = `${concurrentCount}/${limit} team members already on leave during this period. Limit reached.`;
        } else if (concurrentCount >= limit - 1) {
          concurrentWarning = `${concurrentCount}/${limit} team members on leave. Adding this request will reach the limit.`;
        }
      }

      const duration = Date.now() - startTime;
      logger.info('Working days calculated', {
        userId: targetUserId,
        workingDays: result.count,
        calendarDays: result.calendarDays,
        duration
      });

      return res.status(200).json({
        workingDays: result.count,
        calendarDays: result.calendarDays,
        affectedDates: result.dates,
        shiftPattern: teamSettings.shiftPattern.type,
        shiftTime: teamSettings.shiftTime.type,
        warning: concurrentWarning,
        concurrentInfo: {
          count: concurrentCount,
          limit: teamSettings.concurrentLeave?.maxPerTeam || 0,
          enabled: teamSettings.concurrentLeave?.enabled || false
        }
      });
    } catch (err) {
      const duration = Date.now() - startTime;
      logger.error('Error calculating working days', { 
        error: err.message, 
        userId: auth.user.id,
        duration 
      });
      return res.status(500).json({ error: 'Failed to calculate working days' });
    }
  }

  if (req.method === 'GET') {
    // Users can only see their own leaves (unless admin)
    const leaves = await getAllLeaves(auth.user.id, auth.user.role);
    
    const duration = Date.now() - startTime;
    logger.response(req, res, duration, { leaveCount: leaves.length, userId: auth.user.id });
    
    return res.json({ leaves });
  }

  if (req.method === 'POST') {
    // Validate input
    const validation = validateLeaveRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    const { employeeName, startDate, endDate, reason } = validation.data;
    const { workingDaysCount, calendarDaysCount, shiftPattern, shiftTime } = req.body;
    
    const leaveData = {
      userId: auth.user.id,
      username: auth.user.username,
      employeeName,
      startDate,
      endDate,
      reason,
      // Include calculated working days if provided
      ...(workingDaysCount !== undefined && { workingDaysCount: Number(workingDaysCount) }),
      ...(calendarDaysCount !== undefined && { calendarDaysCount: Number(calendarDaysCount) }),
      ...(shiftPattern && { shiftPattern: String(shiftPattern) }),
      ...(shiftTime && { shiftTime: String(shiftTime) })
    };
    
    const newLeave = await addLeaveRequest(leaveData);
    
    logger.info('Leave request created', { 
      leaveId: newLeave._id?.toString(), 
      userId: auth.user.id,
      startDate,
      endDate,
      workingDays: workingDaysCount
    });
    
    const duration = Date.now() - startTime;
    logger.response(req, res, duration);
    
    return res.json({ success: true, leave: newLeave });
  }

  if (req.method === 'PUT') {
    // Only admins can approve/reject leaves
    if (auth.user.role !== 'admin') {
      logger.warn('Non-admin attempted to update leave status', { userId: auth.user.id, role: auth.user.role });
      return res.status(403).json({ error: 'Only admins can approve or reject leave requests' });
    }

    // Extract leave ID from URL path
    const leaveId = req.url.split('/').pop()?.split('?')[0];
    if (!leaveId) {
      return res.status(400).json({ error: 'Leave ID is required' });
    }

    const { status } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (approved or rejected) is required' });
    }

    try {
      const { ObjectId } = await import('mongodb');
      const { db } = await import('./shared/mongodb-storage.js').then(m => m.connectToDatabase());
      const leavesCollection = db.collection('leaves');

      const result = await leavesCollection.updateOne(
        { _id: new ObjectId(leaveId) },
        { $set: { status, updatedAt: new Date(), updatedBy: auth.user.id } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Leave request not found' });
      }

      logger.info('Leave status updated', {
        leaveId,
        status,
        updatedBy: auth.user.id,
        duration: Date.now() - startTime
      });

      const duration = Date.now() - startTime;
      logger.response(req, res, duration);

      return res.json({ success: true, message: `Leave request ${status}` });
    } catch (err) {
      logger.error('Error updating leave status', { error: err.message, leaveId });
      return res.status(500).json({ error: 'Failed to update leave status' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
