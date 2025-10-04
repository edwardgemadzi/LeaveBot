// API endpoint: /api/employees

import { getAllUsers } from './lib/users';

function validateAuth(req: any): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  // In production, validate JWT token here
  return true;
}

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check authentication
  if (!validateAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const users = getAllUsers();
    
    // Format users as employees
    const employees = users.map(user => ({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      shift: 'day',
      schedule_type: 'mon_fri',
    }));
    
    return res.json({ employees });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
