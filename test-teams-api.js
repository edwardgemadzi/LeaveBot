/**
 * Test script to debug the teams API issue
 */

import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

async function testTeamsAPI() {
  console.log('🔍 Testing Teams API...');
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('leavebot');
    const teamsCollection = db.collection('teams');
    const usersCollection = db.collection('users');
    
    console.log('✅ Database connected successfully');
    
    // Test if we can find teams
    console.log('🔍 Testing teams collection...');
    const allTeams = await teamsCollection.find({}).toArray();
    console.log(`📊 Found ${allTeams.length} teams in database`);
    
    // Test if we can find users
    console.log('🔍 Testing users collection...');
    const allUsers = await usersCollection.find({}).toArray();
    console.log(`👥 Found ${allUsers.length} users in database`);
    
    // Find a leader user
    const leader = allUsers.find(u => u.role === 'leader');
    if (leader) {
      console.log(`👑 Found leader: ${leader.name} (${leader._id})`);
      
      // Test the exact query that's failing
      console.log('🔍 Testing leader team query...');
      const leaderTeams = await teamsCollection.find({ 
        leaderId: new ObjectId(leader._id.toString()) 
      }).toArray();
      console.log(`📊 Leader has ${leaderTeams.length} teams`);
      
      // Test the Promise.all mapping
      if (leaderTeams.length > 0) {
        console.log('🔍 Testing team details mapping...');
        const teamsWithDetails = await Promise.all(
          leaderTeams.map(async (team) => {
            const leaderUser = team.leaderId
              ? await usersCollection.findOne({ _id: team.leaderId })
              : null;

            const memberCount = await usersCollection.countDocuments({ teamId: team._id });

            return {
              _id: team._id,
              name: team.name,
              description: team.description,
              leaderId: team.leaderId,
              leaderName: leaderUser ? leaderUser.name : 'Unassigned',
              memberCount,
              createdAt: team.createdAt
            };
          })
        );
        console.log(`✅ Successfully processed ${teamsWithDetails.length} teams`);
        console.log('📋 Team details:', JSON.stringify(teamsWithDetails, null, 2));
      }
    } else {
      console.log('❌ No leader found in database');
    }
    
    await client.close();
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testTeamsAPI();
