import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'leavebot';

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI environment variable');
}

let cachedClient = null;
let cachedDb = null;

// Connect to MongoDB with connection pooling
export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Create indexes for performance
    await createIndexes(db);
    
    cachedClient = client;
    cachedDb = db;
    
    console.log('Connected to MongoDB successfully');
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Create database indexes
async function createIndexes(db) {
  try {
    // Users collection indexes
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('users').createIndex({ teamId: 1 });
    await db.collection('users').createIndex({ role: 1 });
    
    // Teams collection indexes
    await db.collection('teams').createIndex({ name: 1 }, { unique: true });
    await db.collection('teams').createIndex({ leaderId: 1 });
    
    // Leaves collection indexes
    await db.collection('leaves').createIndex({ userId: 1 });
    await db.collection('leaves').createIndex({ teamId: 1 });
    await db.collection('leaves').createIndex({ startDate: 1 });
    await db.collection('leaves').createIndex({ status: 1 });
    await db.collection('leaves').createIndex({ createdAt: 1 });
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
    // Don't throw here as indexes might already exist
  }
}

// Close database connection
export async function closeDatabase() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log('Database connection closed');
  }
}

// Get database instance
export async function getDatabase() {
  const { db } = await connectToDatabase();
  return db;
}
