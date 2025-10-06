import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET, addUser, getUserByUsername } from '../shared/mongodb-storage.js';

// Helper to verify JWT and check permissions
function authenticateAndAuthorize(req, requiredRoles = []) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized', status: 401 };
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
      return { error: 'Forbidden: Insufficient permissions', status: 403 };
    }
    
    return { user: decoded };
  } catch (err) {
    return { error: 'Invalid or expired token', status: 401 };
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST /api/users/create - Create new user (admin and leader can create)
  if (req.method === 'POST') {
    const auth = authenticateAndAuthorize(req, ['admin', 'leader']);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, error: auth.error });
    }

    try {
      const { username, password, name, role } = req.body;

      // Validation
      if (!username || !password || !name) {
        return res.status(400).json({ 
          success: false, 
          error: 'Username, password, and name are required' 
        });
      }

      if (username.length < 3 || username.length > 50) {
        return res.status(400).json({ 
          success: false, 
          error: 'Username must be between 3 and 50 characters' 
        });
      }

      if (password.length < 8) {
        return res.status(400).json({ 
          success: false, 
          error: 'Password must be at least 8 characters' 
        });
      }

      // Valid roles - leaders can only create 'user' role
      let userRole = 'user';
      
      if (auth.user.role === 'admin') {
        // Admins can create any role
        const validRoles = ['user', 'leader', 'admin'];
        userRole = role && validRoles.includes(role) ? role : 'user';
      } else if (auth.user.role === 'leader') {
        // Leaders can only create users
        if (role && role !== 'user') {
          return res.status(403).json({ 
            success: false, 
            error: 'Leaders can only create regular users' 
          });
        }
        userRole = 'user';
      }

      // Check if username already exists
      const existingUser = await getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: 'Username already exists' 
        });
      }

      // Hash password
      const passwordHash = bcrypt.hashSync(password, 10);

      // Create user
      const newUser = await addUser({
        username,
        passwordHash,
        name,
        role: userRole
      });

      // Remove password hash from response
      const { passwordHash: _, ...safeUser } = newUser;

      return res.status(201).json({ 
        success: true, 
        message: 'User created successfully',
        user: {
          ...safeUser,
          id: safeUser._id.toString()
        }
      });
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Handle duplicate key error
      if (error.code === 11000) {
        return res.status(400).json({ 
          success: false, 
          error: 'Username already exists' 
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create user' 
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
