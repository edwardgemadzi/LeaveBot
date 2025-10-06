// Quick MongoDB connection test
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;

async function testConnection() {
  console.log('Testing MongoDB connection...');
  console.log('URI format:', uri?.substring(0, 30) + '...');
  
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected successfully to MongoDB!');
    
    // Test database access
    const db = client.db('leavebot');
    const collections = await db.listCollections().toArray();
    console.log('📦 Available collections:', collections.map(c => c.name));
    
    // Check if users exist
    const users = await db.collection('users').countDocuments();
    console.log('👥 Total users:', users);
    
    // Get one user (without password)
    const sampleUser = await db.collection('users').findOne({}, { projection: { passwordHash: 0 } });
    console.log('📄 Sample user:', sampleUser);
    
    await client.close();
    console.log('✅ Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    if (error.message.includes('Authentication failed')) {
      console.error('🔑 The MongoDB password appears to be incorrect!');
      console.error('📝 Please update your MongoDB password in Atlas and update .env');
    }
  }
}

testConnection();
