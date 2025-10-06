// Test API endpoints locally
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5173';

async function testAPIs() {
  console.log('🧪 Testing API endpoints...\n');
  
  // Test 1: Login to get token
  console.log('1️⃣ Testing login...');
  try {
    const loginRes = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'edgemadzi', password: 'your-password' })
    });
    const loginData = await loginRes.json();
    
    if (loginData.token) {
      console.log('✅ Login successful\n');
      const token = loginData.token;
      
      // Test 2: Get users
      console.log('2️⃣ Testing GET /api/users...');
      const usersRes = await fetch(`${BASE_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      console.log('Status:', usersRes.status);
      console.log('Response:', usersData);
      console.log(usersData.success ? '✅ Users API working\n' : '❌ Users API failed\n');
      
      // Test 3: Get teams
      console.log('3️⃣ Testing GET /api/teams...');
      const teamsRes = await fetch(`${BASE_URL}/api/teams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const teamsData = await teamsRes.json();
      console.log('Status:', teamsRes.status);
      console.log('Response:', teamsData);
      console.log(teamsData.success ? '✅ Teams API working\n' : '❌ Teams API failed\n');
      
    } else {
      console.log('❌ Login failed:', loginData);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPIs();
