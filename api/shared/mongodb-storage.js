import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { logger } from './logger.js';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'leavebot';

let cachedClient = null;
let cachedDb = null;

// Connect to MongoDB (with connection pooling)
export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!MONGODB_URI) {
    throw new Error('Please define MONGODB_URI environment variable');
  }

  const client = await MongoClient.connect(MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
  });

  const db = client.db(DB_NAME);
  
  // Create indexes
  await db.collection('users').createIndex({ username: 1 }, { unique: true });
  await db.collection('leaves').createIndex({ userId: 1 });
  await db.collection('teams').createIndex({ name: 1 }, { unique: true });
  await db.collection('teams').createIndex({ leaderId: 1 });
  
  cachedClient = client;
  cachedDb = db;

  logger.info('Connected to MongoDB successfully');
  return { client, db };
}

// Shared JWT secret
export const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-immediately';

// Initialize admin from environment if provided
export async function initializeAdmin() {
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
    return false;
  }

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ 
      username: process.env.ADMIN_USERNAME 
    });
    
    if (!existingAdmin) {
      const passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
      await usersCollection.insertOne({
        username: process.env.ADMIN_USERNAME,
        passwordHash,
        name: process.env.ADMIN_NAME || 'Administrator',
        role: 'admin',
        createdAt: new Date()
      });
      logger.info('Initial admin user created from environment variables');
      return true;
    }
  } catch (error) {
    logger.error('Error initializing admin', { error: error.message });
  }
  return false;
}

// Get user by username
export async function getUserByUsername(username) {
  try {
    const { db } = await connectToDatabase();
    return await db.collection('users').findOne({ username });
  } catch (error) {
    logger.error('Error getting user:', error);
    return null;
  }
}

// Get user by id
export async function getUserById(id) {
  try {
    const { db } = await connectToDatabase();
    return await db.collection('users').findOne({ _id: id });
  } catch (error) {
    logger.error('Error getting user by id:', error);
    return null;
  }
}

// Add new user
export async function addUser(userData) {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    // Check if this is the first user
    const userCount = await usersCollection.countDocuments();
    const isFirstUser = userCount === 0;
    
    const newUser = {
      ...userData,
      role: isFirstUser ? 'admin' : (userData.role || 'user'),
      createdAt: new Date()
    };
    
    const result = await usersCollection.insertOne(newUser);
    return { _id: result.insertedId, ...newUser };
  } catch (error) {
    logger.error('Error adding user:', error);
    throw error;
  }
}

// Get all users (for admin)
export async function getAllUsers() {
  try {
    const { db } = await connectToDatabase();
    return await db.collection('users').find({}).toArray();
  } catch (error) {
    logger.error('Error getting all users:', error);
    return [];
  }
}

// Leave management functions

// Update user profile
export async function updateUser(userId, updates) {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    // Remove sensitive fields that shouldn't be updated directly
    const { passwordHash, ...safeUpdates } = updates;
    
    const result = await usersCollection.updateOne(
      { _id: userId },
      { $set: { ...safeUpdates, updatedAt: new Date() } }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    logger.error('Error updating user:', error);
    return false;
  }
}

// Delete user
export async function deleteUser(userId) {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    const result = await usersCollection.deleteOne({ _id: userId });
    
    // Also delete all leaves for this user
    if (result.deletedCount > 0) {
      await db.collection('leaves').deleteMany({ userId });
    }
    
    return result.deletedCount > 0;
  } catch (error) {
    logger.error('Error deleting user:', error);
    return false;
  }
}

// Update user password
export async function updateUserPassword(userId, newPassword) {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    const passwordHash = bcrypt.hashSync(newPassword, 10);
    
    const result = await usersCollection.updateOne(
      { _id: userId },
      { $set: { passwordHash, updatedAt: new Date() } }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    logger.error('Error updating password:', error);
    return false;
  }
}

// Leave management functions

// Get all leaves
export async function getAllLeaves(userId = null, role = 'user') {
  try {
    const { db } = await connectToDatabase();
    const leavesCollection = db.collection('leaves');
    
    // Admin and leader can see all leaves, regular users only see their own
    const query = (role === 'admin' || role === 'leader') ? {} : { userId };
    
    return await leavesCollection.find(query).sort({ createdAt: -1 }).toArray();
  } catch (error) {
    logger.error('Error getting leaves:', error);
    return [];
  }
}

// Add leave request
export async function addLeaveRequest(leaveData) {
  try {
    const { db } = await connectToDatabase();
    const leavesCollection = db.collection('leaves');
    
    const newLeave = {
      ...leaveData,
      status: 'pending',
      createdAt: new Date()
    };
    
    const result = await leavesCollection.insertOne(newLeave);
    return { _id: result.insertedId, ...newLeave };
  } catch (error) {
    logger.error('Error adding leave request:', error);
    throw error;
  }
}

// Update leave status (for admin)
export async function updateLeaveStatus(leaveId, status) {
  try {
    const { db } = await connectToDatabase();
    const leavesCollection = db.collection('leaves');
    
    const result = await leavesCollection.updateOne(
      { _id: leaveId },
      { $set: { status, updatedAt: new Date() } }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    logger.error('Error updating leave status:', error);
    return false;
  }
}

// Team management functions

// Get all teams
export async function getAllTeams() {
  try {
    const { db } = await connectToDatabase();
    return await db.collection('teams').find({}).toArray();
  } catch (error) {
    logger.error('Error getting teams:', error);
    return [];
  }
}

// Get team by ID
export async function getTeamById(teamId) {
  try {
    const { db } = await connectToDatabase();
    return await db.collection('teams').findOne({ _id: teamId });
  } catch (error) {
    logger.error('Error getting team:', error);
    return null;
  }
}

// Create team
export async function createTeam(teamData) {
  try {
    const { db } = await connectToDatabase();
    const teamsCollection = db.collection('teams');
    
    const newTeam = {
      ...teamData,
      createdAt: new Date(),
      memberCount: 0
    };
    
    const result = await teamsCollection.insertOne(newTeam);
    return { _id: result.insertedId, ...newTeam };
  } catch (error) {
    logger.error('Error creating team:', error);
    throw error;
  }
}

// Update team
export async function updateTeam(teamId, updates) {
  try {
    const { db } = await connectToDatabase();
    const teamsCollection = db.collection('teams');
    
    const result = await teamsCollection.updateOne(
      { _id: teamId },
      { $set: { ...updates, updatedAt: new Date() } }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    logger.error('Error updating team:', error);
    return false;
  }
}

// Delete team
export async function deleteTeam(teamId) {
  try {
    const { db } = await connectToDatabase();
    const teamsCollection = db.collection('teams');
    const usersCollection = db.collection('users');
    
    // Remove teamId from all users in this team
    await usersCollection.updateMany(
      { teamId },
      { $unset: { teamId: '' } }
    );
    
    const result = await teamsCollection.deleteOne({ _id: teamId });
    return result.deletedCount > 0;
  } catch (error) {
    logger.error('Error deleting team:', error);
    return false;
  }
}

// Assign user to team
export async function assignUserToTeam(userId, teamId) {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    const result = await usersCollection.updateOne(
      { _id: userId },
      { $set: { teamId, updatedAt: new Date() } }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    logger.error('Error assigning user to team:', error);
    return false;
  }
}

// Remove user from team
export async function removeUserFromTeam(userId) {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    const result = await usersCollection.updateOne(
      { _id: userId },
      { $unset: { teamId: '' }, $set: { updatedAt: new Date() } }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    logger.error('Error removing user from team:', error);
    return false;
  }
}

// Get users by team
export async function getUsersByTeam(teamId) {
  try {
    const { db } = await connectToDatabase();
    return await db.collection('users').find({ teamId }).toArray();
  } catch (error) {
    logger.error('Error getting users by team:', error);
    return [];
  }
}

logger.info('Using MongoDB for persistent storage');
