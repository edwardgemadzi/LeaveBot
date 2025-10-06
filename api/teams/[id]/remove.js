import jwt from 'jsonwebtoken';
import { JWT_SECRET, removeUserFromTeam } from '../../shared/mongodb-storage.js';
import { ObjectId } from 'mongodb';

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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const auth = authenticateAndAuthorize(req, ['admin']);
  if (auth.error) {
    return res.status(auth.status).json({ success: false, error: auth.error });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid User ID format' });
    }

    const success = await removeUserFromTeam(new ObjectId(userId));
    
    if (success) {
      return res.status(200).json({ success: true, message: 'User removed from team successfully' });
    } else {
      return res.status(500).json({ success: false, error: 'Failed to remove user from team' });
    }
  } catch (error) {
    console.error('Error removing user from team:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to remove user from team' });
  }
}
