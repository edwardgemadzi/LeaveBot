import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { rateLimiters } from './shared/rate-limiter.js';
import { logger } from './shared/logger.js';
import { validateObjectId, validateTeamName, sanitizeString } from './shared/validators.js';
import { 
  getDefaultTeamSettings, 
  validateShiftPattern, 
  validateConcurrentLeave 
} from './shared/working-days.js';

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

export default async (req, res) => {
  const startTime = Date.now();
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract auth token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    logger.warn('Missing or invalid authorization header', { method: req.method, path: req.url });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    logger.warn('Invalid JWT token', { error: err.message });
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Only admins and leaders can access teams
  if (!['admin', 'leader'].includes(decoded.role)) {
    logger.warn('Forbidden team access', { userId: decoded.id, role: decoded.role });
    return res.status(403).json({ error: 'Access denied' });
  }

  const { id: teamId, action } = req.query;

  try {
    // Route to appropriate handler
    if (req.method === 'GET') {
      if (action === 'settings' && teamId) {
        return await handleGetTeamSettings(req, res, decoded, startTime, teamId);
      } else if (teamId) {
        return await handleGetTeamDetails(req, res, decoded, startTime, teamId);
      } else {
        return await handleListTeams(req, res, decoded, startTime);
      }
    } else if (req.method === 'POST' && !action) {
      return await handleCreateTeam(req, res, decoded, startTime);
    } else if (req.method === 'POST' && action === 'assign') {
      return await handleAssignUser(req, res, decoded, startTime, teamId);
    } else if (req.method === 'POST' && action === 'remove') {
      return await handleRemoveUser(req, res, decoded, startTime, teamId);
    } else if (req.method === 'PUT' && action === 'settings') {
      return await handleUpdateTeamSettings(req, res, decoded, startTime, teamId);
    } else if (req.method === 'PUT') {
      return await handleUpdateTeam(req, res, decoded, startTime, teamId);
    } else if (req.method === 'DELETE') {
      return await handleDeleteTeam(req, res, decoded, startTime, teamId);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error('Unhandled error in teams endpoint', {
      error: err.message,
      stack: err.stack,
      method: req.method,
      userId: decoded.id,
      duration
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/teams - List all teams
async function handleListTeams(req, res, decoded, startTime) {
  const rateLimitResult = rateLimiters.read(req);
  if (!rateLimitResult.allowed) {
    logger.warn('Rate limit exceeded for list teams', { userId: decoded.id });
    return res.status(429).json({ error: rateLimitResult.message });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('leavebot');
    const teamsCollection = db.collection('teams');
    const usersCollection = db.collection('users');

    let query = {};
    if (decoded.role === 'leader') {
      query = { leaderId: new ObjectId(decoded.id) };
    }

    const teams = await teamsCollection.find(query).toArray();
    
    const teamsWithDetails = await Promise.all(
      teams.map(async (team) => {
        const leader = team.leaderId
          ? await usersCollection.findOne({ _id: team.leaderId })
          : null;

        const memberCount = await usersCollection.countDocuments({ teamId: team._id });

        return {
          _id: team._id,
          name: team.name,
          description: team.description,
          leaderId: team.leaderId,
          leaderName: leader ? leader.name : 'Unassigned',
          memberCount,
          createdAt: team.createdAt
        };
      })
    );

    const duration = Date.now() - startTime;
    logger.response(req, res, duration, { teamCount: teamsWithDetails.length });

    return res.status(200).json({ teams: teamsWithDetails });
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error('Error listing teams', { error: err.message, userId: decoded.id, duration });
    return res.status(500).json({ error: 'Failed to list teams' });
  }
}

// GET /api/teams?id={teamId} - Get team details with members
async function handleGetTeamDetails(req, res, decoded, startTime, teamId) {
  const rateLimitResult = rateLimiters.read(req);
  if (!rateLimitResult.allowed) {
    logger.warn('Rate limit exceeded for get team details', { userId: decoded.id, teamId });
    return res.status(429).json({ error: rateLimitResult.message });
  }

  const teamIdValidation = validateObjectId(teamId);
  if (!teamIdValidation.valid) {
    return res.status(400).json({ error: teamIdValidation.error });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('leavebot');
    const teamsCollection = db.collection('teams');
    const usersCollection = db.collection('users');

    const team = await teamsCollection.findOne({ _id: new ObjectId(teamId) });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Leaders can only view their own teams
    if (decoded.role === 'leader' && team.leaderId?.toString() !== decoded.id) {
      logger.warn('Leader attempted to view another team', { userId: decoded.id, teamId });
      return res.status(403).json({ error: 'Access denied' });
    }

    const leader = team.leaderId
      ? await usersCollection.findOne({ _id: team.leaderId })
      : null;

    const members = await usersCollection
      .find({ teamId: team._id })
      .project({ password: 0 })
      .toArray();

    const duration = Date.now() - startTime;
    logger.response(req, res, duration, { teamId, memberCount: members.length });

    return res.status(200).json({
      team: {
        _id: team._id,
        name: team.name,
        description: team.description,
        leaderId: team.leaderId,
        leaderName: leader ? leader.name : 'Unassigned',
        members,
        createdAt: team.createdAt
      }
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error('Error getting team details', { error: err.message, teamId, userId: decoded.id, duration });
    return res.status(500).json({ error: 'Failed to get team details' });
  }
}

// POST /api/teams - Create new team
async function handleCreateTeam(req, res, decoded, startTime) {
  const rateLimitResult = rateLimiters.mutation(req);
  if (!rateLimitResult.allowed) {
    logger.warn('Rate limit exceeded for create team', { userId: decoded.id });
    return res.status(429).json({ error: rateLimitResult.message });
  }

  // Only admins can create teams
  if (decoded.role !== 'admin') {
    logger.warn('Non-admin attempted to create team', { userId: decoded.id, role: decoded.role });
    return res.status(403).json({ error: 'Only admins can create teams' });
  }

  const { name, description, leaderId } = req.body;

  // Validate team name
  const nameValidation = validateTeamName(name);
  if (!nameValidation.valid) {
    return res.status(400).json({ error: nameValidation.error });
  }

  // Validate leader ID if provided
  if (leaderId) {
    const leaderIdValidation = validateObjectId(leaderId);
    if (!leaderIdValidation.valid) {
      return res.status(400).json({ error: 'Invalid leader ID format' });
    }
  }

  const sanitizedDescription = description ? sanitizeString(description) : '';

  try {
    const client = await connectToDatabase();
    const db = client.db('leavebot');
    const teamsCollection = db.collection('teams');
    const usersCollection = db.collection('users');

    // Check if team name already exists
    const existingTeam = await teamsCollection.findOne({ name: nameValidation.value });
    if (existingTeam) {
      return res.status(400).json({ error: 'Team name already exists' });
    }

    // Verify leader exists and is a leader role
    if (leaderId) {
      const leader = await usersCollection.findOne({ _id: new ObjectId(leaderId) });
      if (!leader) {
        return res.status(400).json({ error: 'Leader not found' });
      }
      if (leader.role !== 'leader') {
        return res.status(400).json({ error: 'Selected user is not a leader' });
      }
    }

    const newTeam = {
      name: nameValidation.value,
      description: sanitizedDescription,
      leaderId: leaderId ? new ObjectId(leaderId) : null,
      settings: getDefaultTeamSettings(),
      createdAt: new Date(),
      createdBy: new ObjectId(decoded.id)
    };

    const result = await teamsCollection.insertOne(newTeam);

    const duration = Date.now() - startTime;
    logger.info('Team created', {
      teamId: result.insertedId,
      name: newTeam.name,
      createdBy: decoded.id,
      leaderId: leaderId || null,
      duration
    });

    return res.status(201).json({
      message: 'Team created successfully',
      team: {
        _id: result.insertedId,
        name: newTeam.name,
        description: newTeam.description,
        leaderId: newTeam.leaderId
      }
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error('Error creating team', { error: err.message, userId: decoded.id, duration });
    return res.status(500).json({ error: 'Failed to create team' });
  }
}

// PUT /api/teams?id={teamId} - Update team
async function handleUpdateTeam(req, res, decoded, startTime, teamId) {
  const rateLimitResult = rateLimiters.mutation(req);
  if (!rateLimitResult.allowed) {
    logger.warn('Rate limit exceeded for update team', { userId: decoded.id, teamId });
    return res.status(429).json({ error: rateLimitResult.message });
  }

  // Only admins can update teams
  if (decoded.role !== 'admin') {
    logger.warn('Non-admin attempted to update team', { userId: decoded.id, role: decoded.role });
    return res.status(403).json({ error: 'Only admins can update teams' });
  }

  const teamIdValidation = validateObjectId(teamId);
  if (!teamIdValidation.valid) {
    return res.status(400).json({ error: teamIdValidation.error });
  }

  const { name, description, leaderId } = req.body;
  const updateData = {};

  // Validate and add name if provided
  if (name !== undefined) {
    const nameValidation = validateTeamName(name);
    if (!nameValidation.valid) {
      return res.status(400).json({ error: nameValidation.error });
    }
    updateData.name = nameValidation.value;
  }

  // Sanitize description if provided
  if (description !== undefined) {
    updateData.description = sanitizeString(description);
  }

  // Validate leader ID if provided
  if (leaderId !== undefined) {
    if (leaderId === null) {
      updateData.leaderId = null;
    } else {
      const leaderIdValidation = validateObjectId(leaderId);
      if (!leaderIdValidation.valid) {
        return res.status(400).json({ error: 'Invalid leader ID format' });
      }
      updateData.leaderId = new ObjectId(leaderId);
    }
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'No valid update fields provided' });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('leavebot');
    const teamsCollection = db.collection('teams');
    const usersCollection = db.collection('users');

    const team = await teamsCollection.findOne({ _id: new ObjectId(teamId) });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if new name conflicts with existing team
    if (updateData.name && updateData.name !== team.name) {
      const existingTeam = await teamsCollection.findOne({ name: updateData.name });
      if (existingTeam) {
        return res.status(400).json({ error: 'Team name already exists' });
      }
    }

    // Verify new leader exists and is a leader role
    if (updateData.leaderId && updateData.leaderId !== null) {
      const leader = await usersCollection.findOne({ _id: updateData.leaderId });
      if (!leader) {
        return res.status(400).json({ error: 'Leader not found' });
      }
      if (leader.role !== 'leader') {
        return res.status(400).json({ error: 'Selected user is not a leader' });
      }
    }

    await teamsCollection.updateOne(
      { _id: new ObjectId(teamId) },
      { $set: updateData }
    );

    const duration = Date.now() - startTime;
    logger.info('Team updated', {
      teamId,
      updatedBy: decoded.id,
      fields: Object.keys(updateData),
      duration
    });

    return res.status(200).json({ message: 'Team updated successfully' });
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error('Error updating team', { error: err.message, teamId, userId: decoded.id, duration });
    return res.status(500).json({ error: 'Failed to update team' });
  }
}

// DELETE /api/teams?id={teamId} - Delete team
async function handleDeleteTeam(req, res, decoded, startTime, teamId) {
  const rateLimitResult = rateLimiters.mutation(req);
  if (!rateLimitResult.allowed) {
    logger.warn('Rate limit exceeded for delete team', { userId: decoded.id, teamId });
    return res.status(429).json({ error: rateLimitResult.message });
  }

  // Only admins can delete teams
  if (decoded.role !== 'admin') {
    logger.warn('Non-admin attempted to delete team', { userId: decoded.id, role: decoded.role });
    return res.status(403).json({ error: 'Only admins can delete teams' });
  }

  const teamIdValidation = validateObjectId(teamId);
  if (!teamIdValidation.valid) {
    return res.status(400).json({ error: teamIdValidation.error });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('leavebot');
    const teamsCollection = db.collection('teams');
    const usersCollection = db.collection('users');

    const team = await teamsCollection.findOne({ _id: new ObjectId(teamId) });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Unassign all users from this team
    await usersCollection.updateMany(
      { teamId: new ObjectId(teamId) },
      { $unset: { teamId: "" } }
    );

    // Delete the team
    await teamsCollection.deleteOne({ _id: new ObjectId(teamId) });

    const duration = Date.now() - startTime;
    logger.info('Team deleted', {
      deletedTeam: { id: teamId, name: team.name },
      deletedBy: decoded.id,
      ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      duration
    });

    return res.status(200).json({ message: 'Team deleted successfully' });
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting team', { error: err.message, teamId, userId: decoded.id, duration });
    return res.status(500).json({ error: 'Failed to delete team' });
  }
}

// POST /api/teams?id={teamId}&action=assign - Assign user to team
async function handleAssignUser(req, res, decoded, startTime, teamId) {
  const rateLimitResult = rateLimiters.mutation(req);
  if (!rateLimitResult.allowed) {
    logger.warn('Rate limit exceeded for assign user', { userId: decoded.id, teamId });
    return res.status(429).json({ error: rateLimitResult.message });
  }

  const teamIdValidation = validateObjectId(teamId);
  if (!teamIdValidation.valid) {
    return res.status(400).json({ error: teamIdValidation.error });
  }

  const { userId } = req.body;
  const userIdValidation = validateObjectId(userId);
  if (!userIdValidation.valid) {
    return res.status(400).json({ error: 'Invalid user ID format' });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('leavebot');
    const teamsCollection = db.collection('teams');
    const usersCollection = db.collection('users');

    const team = await teamsCollection.findOne({ _id: new ObjectId(teamId) });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Leaders can only assign to their own teams
    if (decoded.role === 'leader' && team.leaderId?.toString() !== decoded.id) {
      logger.warn('Leader attempted to assign user to another team', { userId: decoded.id, teamId });
      return res.status(403).json({ error: 'Can only assign users to your own team' });
    }

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already in this team
    if (user.teamId?.toString() === teamId) {
      return res.status(400).json({ error: 'User is already in this team' });
    }

    // Assign user to team
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { teamId: new ObjectId(teamId) } }
    );

    const duration = Date.now() - startTime;
    logger.info('User assigned to team', {
      userId,
      userName: user.name,
      teamId,
      teamName: team.name,
      assignedBy: decoded.id,
      duration
    });

    return res.status(200).json({ message: 'User assigned successfully' });
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error('Error assigning user', { error: err.message, teamId, userId: req.body.userId, duration });
    return res.status(500).json({ error: 'Failed to assign user' });
  }
}

// POST /api/teams?id={teamId}&action=remove - Remove user from team
async function handleRemoveUser(req, res, decoded, startTime, teamId) {
  const rateLimitResult = rateLimiters.mutation(req);
  if (!rateLimitResult.allowed) {
    logger.warn('Rate limit exceeded for remove user', { userId: decoded.id, teamId });
    return res.status(429).json({ error: rateLimitResult.message });
  }

  const teamIdValidation = validateObjectId(teamId);
  if (!teamIdValidation.valid) {
    return res.status(400).json({ error: teamIdValidation.error });
  }

  const { userId } = req.body;
  const userIdValidation = validateObjectId(userId);
  if (!userIdValidation.valid) {
    return res.status(400).json({ error: 'Invalid user ID format' });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('leavebot');
    const teamsCollection = db.collection('teams');
    const usersCollection = db.collection('users');

    const team = await teamsCollection.findOne({ _id: new ObjectId(teamId) });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Leaders can only remove from their own teams
    if (decoded.role === 'leader' && team.leaderId?.toString() !== decoded.id) {
      logger.warn('Leader attempted to remove user from another team', { userId: decoded.id, teamId });
      return res.status(403).json({ error: 'Can only remove users from your own team' });
    }

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is in this team
    if (user.teamId?.toString() !== teamId) {
      return res.status(400).json({ error: 'User is not in this team' });
    }

    // Remove user from team
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $unset: { teamId: "" } }
    );

    const duration = Date.now() - startTime;
    logger.info('User removed from team', {
      userId,
      userName: user.name,
      teamId,
      teamName: team.name,
      removedBy: decoded.id,
      duration
    });

    return res.status(200).json({ message: 'User removed successfully' });
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error('Error removing user', { error: err.message, teamId, userId: req.body.userId, duration });
    return res.status(500).json({ error: 'Failed to remove user' });
  }
}

// GET /api/teams?id={teamId}&action=settings - Get team settings
async function handleGetTeamSettings(req, res, decoded, startTime, teamId) {
  const rateLimitResult = rateLimiters.read(req);
  if (!rateLimitResult.allowed) {
    logger.warn('Rate limit exceeded for get team settings', { userId: decoded.id, teamId });
    return res.status(429).json({ error: rateLimitResult.message });
  }

  const teamIdValidation = validateObjectId(teamId);
  if (!teamIdValidation.valid) {
    return res.status(400).json({ error: teamIdValidation.error });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('leavebot');
    const teamsCollection = db.collection('teams');

    const team = await teamsCollection.findOne({ _id: new ObjectId(teamId) });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Leaders can only view their own team settings
    if (decoded.role === 'leader' && team.leaderId?.toString() !== decoded.id) {
      logger.warn('Leader attempted to view another team settings', { userId: decoded.id, teamId });
      return res.status(403).json({ error: 'Access denied' });
    }

    // Return settings or defaults
    const settings = team.settings || getDefaultTeamSettings();

    const duration = Date.now() - startTime;
    logger.response(req, res, duration, { teamId });

    return res.status(200).json({
      settings,
      team: {
        _id: team._id,
        name: team.name,
        description: team.description,
        leaderId: team.leaderId
      }
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error('Error getting team settings', { error: err.message, teamId, userId: decoded.id, duration });
    return res.status(500).json({ error: 'Failed to get team settings' });
  }
}

// PUT /api/teams?id={teamId}&action=settings - Update team settings
async function handleUpdateTeamSettings(req, res, decoded, startTime, teamId) {
  const rateLimitResult = rateLimiters.mutation(req);
  if (!rateLimitResult.allowed) {
    logger.warn('Rate limit exceeded for update team settings', { userId: decoded.id, teamId });
    return res.status(429).json({ error: rateLimitResult.message });
  }

  const teamIdValidation = validateObjectId(teamId);
  if (!teamIdValidation.valid) {
    return res.status(400).json({ error: teamIdValidation.error });
  }

  // Only admins and team leaders can update settings
  if (decoded.role !== 'admin' && decoded.role !== 'leader') {
    logger.warn('Non-admin/leader attempted to update team settings', { userId: decoded.id, role: decoded.role });
    return res.status(403).json({ error: 'Only admins and team leaders can update team settings' });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('leavebot');
    const teamsCollection = db.collection('teams');

    const team = await teamsCollection.findOne({ _id: new ObjectId(teamId) });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Leaders can only update their own team settings
    if (decoded.role === 'leader' && team.leaderId?.toString() !== decoded.id) {
      logger.warn('Leader attempted to update another team settings', { userId: decoded.id, teamId });
      return res.status(403).json({ error: 'Can only update settings for your own team' });
    }

    const { shiftPattern, shiftTime, workingDays, concurrentLeave, annualLeaveDays } = req.body;

    // Validate shift pattern if provided
    if (shiftPattern) {
      const validation = validateShiftPattern(shiftPattern);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    }

    // Validate concurrent leave settings if provided
    if (concurrentLeave) {
      const validation = validateConcurrentLeave(concurrentLeave);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    }

    // Validate annual leave days
    if (annualLeaveDays !== undefined) {
      if (typeof annualLeaveDays !== 'number' || annualLeaveDays < 1 || annualLeaveDays > 365) {
        return res.status(400).json({ error: 'Annual leave days must be between 1 and 365' });
      }
    }

    // Get current settings or defaults
    const currentSettings = team.settings || getDefaultTeamSettings();

    // Merge with new settings
    const updatedSettings = {
      shiftPattern: shiftPattern || currentSettings.shiftPattern,
      shiftTime: shiftTime || currentSettings.shiftTime,
      workingDays: workingDays || currentSettings.workingDays,
      concurrentLeave: concurrentLeave || currentSettings.concurrentLeave,
      annualLeaveDays: annualLeaveDays !== undefined ? annualLeaveDays : currentSettings.annualLeaveDays,
      updatedAt: new Date(),
      updatedBy: new ObjectId(decoded.id)
    };

    await teamsCollection.updateOne(
      { _id: new ObjectId(teamId) },
      { $set: { settings: updatedSettings } }
    );

    const duration = Date.now() - startTime;
    logger.info('Team settings updated', {
      teamId,
      updatedBy: decoded.id,
      fields: Object.keys(req.body),
      duration
    });

    return res.status(200).json({
      message: 'Team settings updated successfully',
      settings: updatedSettings
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    logger.error('Error updating team settings', { error: err.message, teamId, userId: decoded.id, duration });
    return res.status(500).json({ error: 'Failed to update team settings' });
  }
}
