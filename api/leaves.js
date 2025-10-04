import jwt from 'jsonwebtoken';
import { JWT_SECRET, getAllLeaves, addLeaveRequest } from './shared/mongodb-storage.js';

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
  // Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // Authenticate all requests
  const auth = authenticateToken(req);
  if (!auth.authenticated) {
    return res.status(401).json({ error: auth.error });
  }

  if (req.method === 'GET') {
    // Users can only see their own leaves (unless admin)
    const leaves = await getAllLeaves(auth.user.id, auth.user.role);
    return res.json({ leaves });
  }

  if (req.method === 'POST') {
    // Validate input
    const validation = validateLeaveRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    const { employeeName, startDate, endDate, reason } = validation.data;
    
    const leaveData = {
      userId: auth.user.id,
      username: auth.user.username,
      employeeName,
      startDate,
      endDate,
      reason
    };
    
    const newLeave = await addLeaveRequest(leaveData);
    return res.json({ success: true, leave: newLeave });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
