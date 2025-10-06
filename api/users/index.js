import jwt from 'jsonwebtoken';
import { JWT_SECRET, getAllUsers } from '../shared/mongodb-storage.js';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/users - List all users (admin and leader can access)
  if (req.method === 'GET') {
    const auth = authenticateAndAuthorize(req, ['admin', 'leader']);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, error: auth.error });
    }

    try {
      const users = await getAllUsers();
      
      // Leaders can only see users and other leaders, not admins
      let filteredUsers = users;
      if (auth.user.role === 'leader') {
        filteredUsers = users.filter(u => u.role !== 'admin');
      }
      
      // Remove password hashes from response
      const safeUsers = filteredUsers.map(({ passwordHash, ...user }) => ({
        ...user,
        id: user._id.toString()
      }));
      
      return res.status(200).json({ success: true, users: safeUsers });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
