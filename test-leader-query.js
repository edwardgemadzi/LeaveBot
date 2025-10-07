import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

async function testLeaderQuery() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('leavebot');
    const usersCollection = db.collection('users');
    const teamsCollection = db.collection('teams');
    const leavesCollection = db.collection('leaves');
    
    // Find the leader
    const leader = await usersCollection.findOne({ username: 'danamanor' });
    console.log('👤 LEADER:', leader.name);
    console.log('   ID:', leader._id.toString());
    console.log('   Role:', leader.role);
    console.log('   TeamID:', leader.teamId || 'None');
    console.log();
    
    // Find the leader's team
    const team = await teamsCollection.findOne({ leaderId: leader._id });
    console.log('🏢 TEAM:', team.name);
    console.log('   Team ID:', team._id.toString());
    console.log('   Leader ID:', team.leaderId.toString());
    console.log();
    
    // Test OLD query (should miss the leader)
    console.log('❌ OLD QUERY (teamId only):');
    const oldQuery = { teamId: team._id };
    const oldMembers = await usersCollection.find(oldQuery).toArray();
    console.log('   Found', oldMembers.length, 'members:');
    oldMembers.forEach(m => console.log('   -', m.name, `(${m.role})`));
    const oldMemberIds = oldMembers.map(m => m._id.toString());
    const oldLeaves = await leavesCollection.find({ userId: { $in: oldMemberIds } }).toArray();
    console.log('   Would show', oldLeaves.length, 'leave requests');
    console.log();
    
    // Test NEW query (should include the leader)
    console.log('✅ NEW QUERY (teamId OR leader _id):');
    const newQuery = {
      $or: [
        { teamId: team._id },
        { _id: leader._id }
      ]
    };
    const newMembers = await usersCollection.find(newQuery).toArray();
    console.log('   Found', newMembers.length, 'members:');
    newMembers.forEach(m => console.log('   -', m.name, `(${m.role})`));
    const newMemberIds = newMembers.map(m => m._id.toString());
    const newLeaves = await leavesCollection.find({ userId: { $in: newMemberIds } }).toArray();
    console.log('   Would show', newLeaves.length, 'leave requests:');
    newLeaves.forEach(l => console.log('   -', l.employeeName, `(${l.status})`));
    console.log();
    
    // Check actual leaves
    console.log('📋 ALL LEAVES IN DATABASE:');
    const allLeaves = await leavesCollection.find({}).toArray();
    allLeaves.forEach(l => {
      const inOldQuery = oldMemberIds.includes(l.userId);
      const inNewQuery = newMemberIds.includes(l.userId);
      console.log(`   - ${l.employeeName} (${l.status})`);
      console.log(`     User ID: ${l.userId}`);
      console.log(`     Old query would show: ${inOldQuery ? '✅' : '❌'}`);
      console.log(`     New query would show: ${inNewQuery ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testLeaderQuery();
