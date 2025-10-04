// API endpoint: /api/auth/register
// Register new users (admin/supervisor only)

import { createUser, getUserByUsername } from '../lib/users';

function validateAuth(req: any): { valid: boolean; userId?: number; role?: string } {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false };
  }

  const token = authHeader.substring(7);
  
  // Decode token to get user info (in production, verify JWT properly)
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    
    if (parts.length >= 2) {
      const username = parts[0];
      const user = getUserByUsername(username);
      
      if (user) {
        return { valid: true, userId: user.id, role: user.role };
      }
    }
  } catch (error) {
    console.error('Token validation error:', error);
  }
  
  return { valid: false };
}

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
    // Verify admin authentication
    const auth = validateAuth(req);
    
    if (!auth.valid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Only admins and supervisors can register new users
    if (auth.role !== 'admin' && auth.role !== 'supervisor') {
      return res.status(403).json({ error: 'Only admins and supervisors can register new users' });
    }

    const { name, telegram_username, password, role, supervisor_id } = req.body;

    // Validate required fields
    if (!name || !telegram_username || !password || !role) {
      return res.status(400).json({ 
        error: 'Name, telegram_username, password, and role are required' 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Validate role
    if (!['admin', 'supervisor', 'team_member'].includes(role)) {
      return res.status(400).json({ 
        error: 'Role must be admin, supervisor, or team_member' 
      });
    }

    // Supervisors can only create team members
    if (auth.role === 'supervisor' && role !== 'team_member') {
      return res.status(403).json({ 
        error: 'Supervisors can only register team members' 
      });
    }

    // Check if username already exists
    const existingUser = getUserByUsername(telegram_username);
    if (existingUser) {
      return res.status(409).json({ 
        error: 'A user with this Telegram username already exists' 
      });
    }

    // Create new user (in production, hash the password!)
    const newUser = createUser({
      name: name.trim(),
      telegram_username: telegram_username.toLowerCase().trim(),
      password: password, // In production: await bcrypt.hash(password, 10)
      role,
      created_by: auth.userId,
      supervisor_id: supervisor_id || (auth.role === 'supervisor' ? auth.userId : undefined),
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        telegram_username: newUser.telegram_username,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
