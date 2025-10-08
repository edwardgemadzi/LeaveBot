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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
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
    const { action, id } = req.query;

    // GET /api/users?id={userId}&action=settings - Get user settings
    if (req.method === 'GET' && id && action === 'settings') {
      return await handleGetUserSettings(req, res, decoded, startTime, id);
    }

    // PUT /api/users?id={userId}&action=settings - Update user settings
    if (req.method === 'PUT' && id && action === 'settings') {
      return await handleUpdateUserSettings(req, res, decoded, startTime, id);
    }

    // POST /api/users?action=password - Change password
    if (req.method === 'POST' && action === 'password') {
      return await handlePasswordChange(req, res, decoded, startTime);
    }

    // POST /api/users?action=create - Create user
    if (req.method === 'POST' && action === 'create') {
      return await handleCreateUser(req, res, decoded, startTime);
    }

    // PUT /api/users?id={userId} - Update user
    if (req.method === 'PUT' && id) {
      return await handleUpdateUser(req, res, decoded, startTime, id);
    }

    // DELETE /api/users?id={userId} - Delete user
    if (req.method === 'DELETE' && id) {
      return await handleDeleteUser(req, res, decoded, startTime, id);
    }

    // GET /api/users - List users
    if (req.method === 'GET') {
      return await handleListUsers(req, res, decoded, startTime);
    }

    return res.status(400).json({ success: false, error: 'Invalid action or missing parameters' });

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

  // Admins can change any password, leaders can only change team user passwords
  if (decoded.role !== 'admin') {
    if (decoded.role !== 'leader') {
      return res.status(403).json({ success: false, error: 'Only admins and leaders can change user passwords' });
    }
    
    // Leaders can only change passwords for users in their team
    const teamsCollection = db.collection('teams');
    const team = await teamsCollection.findOne({ leaderId: new ObjectId(decoded.id) });
    
    if (!team) {
      return res.status(403).json({ success: false, error: 'You must be assigned as a team leader to change passwords' });
    }
    
    if (!user.teamId || user.teamId.toString() !== team._id.toString()) {
      return res.status(403).json({ success: false, error: 'Can only change passwords for users in your team' });
    }
    
    // Leaders cannot change admin or leader passwords
    if (user.role === 'admin' || user.role === 'leader') {
      return res.status(403).json({ success: false, error: 'Cannot change passwords for admins or leaders' });
    }
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

// Handler for updating users (PUT /api/users?id={userId})
async function handleUpdateUser(req, res, decoded, startTime, userId) {
  // Rate limiting for mutations
  const rateLimit = rateLimiters.mutation(req);
  Object.entries(rateLimit.headers || {}).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded', { endpoint: '/api/users', action: 'update', ip: req.headers['x-forwarded-for'] });
    return res.status(429).json({ success: false, error: rateLimit.message });
  }

  if (!['admin', 'leader'].includes(decoded.role)) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  // Validate userId
  const userIdValidation = validateObjectId(userId);
  if (!userIdValidation.valid) {
    return res.status(400).json({ success: false, error: userIdValidation.error });
  }

  const { name, role } = req.body;

  const updateData = {};

  // Validate and add name if provided
  if (name) {
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return res.status(400).json({ success: false, error: nameValidation.error });
    }
    updateData.name = nameValidation.value;
  }

  // Validate and add role if provided
  if (role) {
    const roleValidation = validateRole(role);
    if (!roleValidation.valid) {
      return res.status(400).json({ success: false, error: roleValidation.error });
    }

    // Leaders cannot create/update to admin role
    if (decoded.role === 'leader' && role === 'admin') {
      return res.status(403).json({ success: false, error: 'Leaders cannot set admin role' });
    }

    updateData.role = roleValidation.value;
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ success: false, error: 'No valid update fields provided' });
  }

  updateData.updatedAt = new Date();

  const client = await connectDB();
  const db = client.db('leavebot');
  const usersCollection = db.collection('users');

  // Update user
  const result = await usersCollection.updateOne(
    { _id: new ObjectId(userIdValidation.value) },
    { $set: updateData }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  logger.info('User updated', { 
    userId: userIdValidation.value,
    updatedBy: decoded.username,
    fields: Object.keys(updateData)
  });

  const duration = Date.now() - startTime;
  logger.response(req, res, duration);

  return res.status(200).json({ 
    success: true, 
    message: 'User updated successfully'
  });
}

// Handler for deleting users (DELETE /api/users?id={userId})
async function handleDeleteUser(req, res, decoded, startTime, userId) {
  // Rate limiting for mutations
  const rateLimit = rateLimiters.mutation(req);
  Object.entries(rateLimit.headers || {}).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded', { endpoint: '/api/users', action: 'delete', ip: req.headers['x-forwarded-for'] });
    return res.status(429).json({ success: false, error: rateLimit.message });
  }

  // Admins can delete anyone, leaders can only delete users in their team
  if (decoded.role !== 'admin') {
    if (decoded.role !== 'leader') {
      return res.status(403).json({ success: false, error: 'Only admins and leaders can delete users' });
    }
    
    // Leaders can only delete users in their team
    const teamsCollection = db.collection('teams');
    const team = await teamsCollection.findOne({ leaderId: new ObjectId(decoded.id) });
    
    if (!team) {
      return res.status(403).json({ success: false, error: 'You must be assigned as a team leader to delete users' });
    }
    
    if (!user.teamId || user.teamId.toString() !== team._id.toString()) {
      return res.status(403).json({ success: false, error: 'Can only delete users in your team' });
    }
    
    // Leaders cannot delete admins or other leaders
    if (user.role === 'admin' || user.role === 'leader') {
      return res.status(403).json({ success: false, error: 'Cannot delete admins or leaders' });
    }
  }

  // Validate userId
  const userIdValidation = validateObjectId(userId);
  if (!userIdValidation.valid) {
    return res.status(400).json({ success: false, error: userIdValidation.error });
  }

  const client = await connectDB();
  const db = client.db('leavebot');
  const usersCollection = db.collection('users');
  const leavesCollection = db.collection('leaves');

  // Check if user exists
  const user = await usersCollection.findOne({ _id: new ObjectId(userIdValidation.value) });
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  // Prevent deleting yourself
  if (user._id.toString() === decoded.id) {
    return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
  }

  // Delete user's leave requests
  await leavesCollection.deleteMany({ userId: new ObjectId(userIdValidation.value) });

  // Delete user
  await usersCollection.deleteOne({ _id: new ObjectId(userIdValidation.value) });

  logger.info('User deleted', { 
    deletedUser: user.username,
    deletedBy: decoded.username,
    ip: req.headers['x-forwarded-for']
  });

  const duration = Date.now() - startTime;
  logger.response(req, res, duration);

  return res.status(200).json({ 
    success: true, 
    message: 'User and associated leave requests deleted successfully'
  });
}

// Handler: Get user settings
async function handleGetUserSettings(req, res, decoded, startTime, id) {
  // Connect to database
  const client = await connectDB();
  const db = client.db('leavebot');
  const usersCollection = db.collection('users');
  const teamsCollection = db.collection('teams');

  // Validate user ID
  const userIdValidation = validateObjectId(id);
  if (!userIdValidation.valid) {
    return res.status(400).json({ success: false, error: userIdValidation.error });
  }

  // Fetch user
  const user = await usersCollection.findOne({ _id: new ObjectId(userIdValidation.value) });
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  // Check authorization: user can get their own settings, or admins can get any
  if (decoded.role !== 'admin' && decoded.id !== user._id.toString()) {
    return res.status(403).json({ 
      success: false, 
      error: 'Unauthorized: You can only view your own settings' 
    });
  }

  // Get user settings or fallback to team defaults
  let settings = user.settings || {};

  // If no user settings, try to get team defaults
  if (Object.keys(settings).length === 0 && user.teamId) {
    const team = await teamsCollection.findOne({ _id: user.teamId });
    if (team && team.settings && team.settings.defaults) {
      settings = team.settings.defaults;
    }
  }

  // Apply system defaults if still empty
  if (Object.keys(settings).length === 0) {
    settings = {
      shiftPattern: { type: 'regular' },
      shiftTime: { type: 'day' },
      workingDays: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false
      }
    };
  }

  logger.info('User settings retrieved', { 
    userId: user._id.toString(),
    username: user.username,
    hasCustomSettings: !!user.settings,
    requestedBy: decoded.username
  });

  const duration = Date.now() - startTime;
  logger.response(req, res, duration);

  return res.status(200).json({ 
    success: true, 
    settings,
    hasCustomSettings: !!user.settings
  });
}

// Handler: Update user settings
async function handleUpdateUserSettings(req, res, decoded, startTime, id) {
  // Connect to database
  const client = await connectDB();
  const db = client.db('leavebot');
  const usersCollection = db.collection('users');

  // Validate user ID
  const userIdValidation = validateObjectId(id);
  if (!userIdValidation.valid) {
    return res.status(400).json({ success: false, error: userIdValidation.error });
  }

  // Fetch user
  const user = await usersCollection.findOne({ _id: new ObjectId(userIdValidation.value) });
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  // Check authorization
  // - User can update their own settings
  // - Admins can update any user's settings
  // - Leaders can update their team members' settings
  if (decoded.id !== user._id.toString()) {
    if (decoded.role === 'admin') {
      // Admin can update any user
    } else if (decoded.role === 'leader') {
      // Leader can only update team members (not admins or other leaders)
      if (user.role === 'admin' || user.role === 'leader') {
        return res.status(403).json({ 
          success: false, 
          error: 'Leaders cannot update admin or leader settings' 
        });
      }
      
      // Check if user is in leader's team
      const teamsCollection = db.collection('teams');
      const team = await teamsCollection.findOne({ leaderId: new ObjectId(decoded.id) });
      
      if (!team || !user.teamId || user.teamId.toString() !== team._id.toString()) {
        return res.status(403).json({ 
          success: false, 
          error: 'Can only update settings for users in your team' 
        });
      }
    } else {
      // Regular user can only update own settings
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized: You can only update your own settings' 
      });
    }
  }

  // Validate settings structure
  const { shiftPattern, shiftTime, workingDays } = req.body;

  const newSettings = {};

  // Validate shift pattern
  if (shiftPattern) {
    if (!shiftPattern.type) {
      return res.status(400).json({ 
        success: false, 
        error: 'Shift pattern must have a type' 
      });
    }

    const validPatterns = ['regular', '2-2', '3-3', '4-4', '5-5'];
    if (!validPatterns.includes(shiftPattern.type)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid shift pattern type. Must be one of: ${validPatterns.join(', ')}` 
      });
    }

    // For rotation patterns, require reference date
    if (shiftPattern.type !== 'regular' && !shiftPattern.referenceDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rotation shift patterns require a reference date' 
      });
    }

    newSettings.shiftPattern = shiftPattern;
  }

  // Validate shift time
  if (shiftTime) {
    if (!shiftTime.type) {
      return res.status(400).json({ 
        success: false, 
        error: 'Shift time must have a type' 
      });
    }

    const validTimes = ['day', 'night', 'custom'];
    if (!validTimes.includes(shiftTime.type)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid shift time type. Must be one of: ${validTimes.join(', ')}` 
      });
    }

    // Validate custom time fields if type is custom
    if (shiftTime.type === 'custom') {
      if (!shiftTime.customStart || !shiftTime.customEnd) {
        return res.status(400).json({ 
          success: false, 
          error: 'Custom shift time requires customStart and customEnd times' 
        });
      }
      
      // Basic time format validation (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(shiftTime.customStart) || !timeRegex.test(shiftTime.customEnd)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Custom times must be in HH:MM format (e.g., 08:00, 17:00)' 
        });
      }
    }

    newSettings.shiftTime = shiftTime;
  }

  // Validate working days
  if (workingDays) {
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const workingDaysObj = {};
    let hasAtLeastOneDay = false;

    for (const day of validDays) {
      if (workingDays.hasOwnProperty(day)) {
        if (typeof workingDays[day] !== 'boolean') {
          return res.status(400).json({ 
            success: false, 
            error: `Working day '${day}' must be a boolean` 
          });
        }
        workingDaysObj[day] = workingDays[day];
        if (workingDays[day]) hasAtLeastOneDay = true;
      }
    }

    // Only require at least one day for 'regular' patterns
    // Rotation patterns (2-2, 3-3, etc) work any day of the week
    const patternType = newSettings.shiftPattern?.type || user.settings?.shiftPattern?.type || 'regular';
    if (!hasAtLeastOneDay && patternType === 'regular') {
      return res.status(400).json({ 
        success: false, 
        error: 'At least one working day must be selected for regular patterns' 
      });
    }

    newSettings.workingDays = workingDaysObj;
  }

  // Merge with existing settings
  const updatedSettings = { ...user.settings, ...newSettings };

  // Update user settings
  await usersCollection.updateOne(
    { _id: new ObjectId(userIdValidation.value) },
    { $set: { settings: updatedSettings } }
  );

  logger.info('User settings updated', { 
    userId: user._id.toString(),
    username: user.username,
    updatedFields: Object.keys(newSettings),
    updatedBy: decoded.username
  });

  const duration = Date.now() - startTime;
  logger.response(req, res, duration);

  return res.status(200).json({ 
    success: true, 
    message: 'User settings updated successfully',
    settings: updatedSettings
  });
}

