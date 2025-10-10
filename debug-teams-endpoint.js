/**
 * Debug script to test the teams endpoint directly
 */

import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

async function debugTeamsEndpoint() {
  console.log('🔍 Debugging Teams Endpoint...');
  
  try {
    // Create a test JWT token for a leader
    const testLeaderId = '68e3f94de3dd60636684ceab'; // Daniel Amanor from the test
    const testToken = jwt.sign(
      { 
        id: testLeaderId, 
        username: 'daniel.amanor', 
        role: 'leader' 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('🔑 Created test JWT token for leader:', testLeaderId);
    
    // Test the endpoint
    const response = await fetch('http://localhost:3000/api/teams', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📡 Response body:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Success! Teams data:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Error response:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the debug
debugTeamsEndpoint();
