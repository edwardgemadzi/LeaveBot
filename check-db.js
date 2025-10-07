import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('leavebot');
    
    // Check users
    console.log('👥 USERS:');
    console.log('='.repeat(50));
    const users = await db.collection('users').find({}).toArray();
    users.forEach(user => {
      console.log(`- ${user.name} (@${user.username})`);
      console.log(`  Role: ${user.role}`);
      console.log(`  ID: ${user._id.toString()}`);
      console.log(`  TeamID: ${user.teamId || 'None'}`);
      console.log();
    });
    
    // Check teams
    console.log('\n🏢 TEAMS:');
    console.log('='.repeat(50));
    const teams = await db.collection('teams').find({}).toArray();
    if (teams.length === 0) {
      console.log('❌ NO TEAMS FOUND! This is the problem!');
      console.log('Leaders need to be assigned to teams to see team requests.\n');
    } else {
      teams.forEach(team => {
        console.log(`- ${team.name}`);
        console.log(`  Team ID: ${team._id.toString()}`);
        console.log(`  Leader ID: ${team.leaderId?.toString() || 'None'}`);
        console.log();
      });
    }
    
    // Check leaves
    console.log('\n📋 LEAVE REQUESTS:');
    console.log('='.repeat(50));
    const leaves = await db.collection('leaves').find({}).toArray();
    if (leaves.length === 0) {
      console.log('No leave requests found.');
    } else {
      leaves.forEach(leave => {
        console.log(`- ${leave.employeeName}`);
        console.log(`  User ID: ${leave.userId}`);
        console.log(`  Status: ${leave.status}`);
        console.log(`  Dates: ${leave.startDate} to ${leave.endDate}`);
        console.log();
      });
    }
    
    // Check for leader without team
    console.log('\n🔍 DIAGNOSIS:');
    console.log('='.repeat(50));
    const leaders = users.filter(u => u.role === 'leader');
    if (leaders.length > 0) {
      leaders.forEach(leader => {
        const leaderTeam = teams.find(t => t.leaderId?.toString() === leader._id.toString());
        if (!leaderTeam) {
          console.log(`❌ Leader "${leader.name}" is NOT assigned to any team!`);
          console.log(`   This is why they can't see team requests.`);
        } else {
          console.log(`✅ Leader "${leader.name}" is assigned to team "${leaderTeam.name}"`);
          const teamMembers = users.filter(u => u.teamId?.toString() === leaderTeam._id.toString());
          console.log(`   Team has ${teamMembers.length} members:`);
          teamMembers.forEach(m => console.log(`   - ${m.name} (${m.role})`));
        }
      });
    } else {
      console.log('No leaders found in database.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkDatabase();
