// API endpoint: /api/auth/login
// Simple login with username and password

import { getUserByUsername } from '../lib/users';

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { telegram_username, password } = req.body;

    if (!telegram_username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const username = telegram_username.toLowerCase().trim();

    // Get user from database
    const user = getUserByUsername(username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check password (in production, use bcrypt.compare)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Simple auth token (in production, use proper JWT)
    const token = Buffer.from(`${user.id}:${user.telegram_username}`).toString('base64');

    return res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        telegram_username: user.telegram_username,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
