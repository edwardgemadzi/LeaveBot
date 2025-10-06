const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const { rateLimiter } = require('../shared/rate-limiter');
const { logger } = require('../shared/logger');
const { 
  calculateWorkingDays, 
  getDefaultTeamSettings 
} = require('../shared/working-days');

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

module.exports = async (req, res) => {
  const startTime = Date.now();
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const rateLimitResult = rateLimiter.read(req);
  if (rateLimitResult.blocked) {
    logger.warn('Rate limit exceeded for calculate working days', { ip: req.headers['x-forwarded-for'] });
    return res.status(429).json({ error: rateLimitResult.error });
  }

  // Extract auth token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
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
    const client = await connectToDatabase();
    const db = client.db('leavebot');
    const usersCollection = db.collection('users');
    const teamsCollection = db.collection('teams');
    const leavesCollection = db.collection('leaves');

    // Get user's team and settings
    const targetUserId = userId || decoded.id;
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
      userId: decoded.id,
      duration 
    });
    return res.status(500).json({ error: 'Failed to calculate working days' });
  }
};
