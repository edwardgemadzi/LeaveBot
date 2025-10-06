import jwt from 'jsonwebtoken';
import { 
  JWT_SECRET, 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  updateUserPassword 
} from '../shared/mongodb-storage.js';
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
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

  // PUT /api/users/:id - Update user (admin can update anyone, leader can update users only)
  if (req.method === 'PUT') {
    const auth = authenticateAndAuthorize(req, ['admin', 'leader']);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, error: auth.error });
    }

    try {
      const { id } = req.query;
      const updates = req.body;

      if (!id) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
      }

      // Get the user being updated
      const targetUser = await getUserById(new ObjectId(id));
      if (!targetUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Leaders cannot update admins or other leaders
      if (auth.user.role === 'leader' && targetUser.role !== 'user') {
        return res.status(403).json({ 
          success: false, 
          error: 'Leaders can only manage regular users' 
        });
      }

      // Leaders cannot promote users to leader or admin
      if (auth.user.role === 'leader' && updates.role && updates.role !== 'user') {
        return res.status(403).json({ 
          success: false, 
          error: 'Leaders cannot change user roles' 
        });
      }

      // Prevent self-demotion
      if (id === auth.user.id && updates.role && updates.role !== auth.user.role) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot change your own role' 
        });
      }

      const success = await updateUser(new ObjectId(id), updates);
      
      if (success) {
        return res.status(200).json({ success: true, message: 'User updated successfully' });
      } else {
        return res.status(500).json({ success: false, error: 'Failed to update user' });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ success: false, error: 'Failed to update user' });
    }
  }

  // DELETE /api/users/:id - Delete user (admin can delete anyone, leader can delete users only)
  if (req.method === 'DELETE') {
    const auth = authenticateAndAuthorize(req, ['admin', 'leader']);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, error: auth.error });
    }

    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
      }

      // Prevent self-deletion
      if (id === auth.user.id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot delete your own account' 
        });
      }

      // Get the user being deleted
      const targetUser = await getUserById(new ObjectId(id));
      if (!targetUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Leaders cannot delete admins or other leaders
      if (auth.user.role === 'leader' && targetUser.role !== 'user') {
        return res.status(403).json({ 
          success: false, 
          error: 'Leaders can only delete regular users' 
        });
      }

      const success = await deleteUser(new ObjectId(id));
      
      if (success) {
        return res.status(200).json({ success: true, message: 'User deleted successfully' });
      } else {
        return res.status(500).json({ success: false, error: 'Failed to delete user' });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ success: false, error: 'Failed to delete user' });
    }
  }

  // POST /api/users/:id/password - Update user password
  if (req.method === 'POST' && req.url.includes('/password')) {
    const auth = authenticateAndAuthorize(req, ['admin', 'leader']);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, error: auth.error });
    }

    try {
      const { id } = req.query;
      const { newPassword } = req.body;

      if (!id || !newPassword) {
        return res.status(400).json({ 
          success: false, 
          error: 'User ID and new password are required' 
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ 
          success: false, 
          error: 'Password must be at least 8 characters' 
        });
      }

      // Get the user being updated
      const targetUser = await getUserById(new ObjectId(id));
      if (!targetUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Leaders cannot change passwords for admins or other leaders
      if (auth.user.role === 'leader' && targetUser.role !== 'user') {
        return res.status(403).json({ 
          success: false, 
          error: 'Leaders can only manage regular users' 
        });
      }

      const success = await updateUserPassword(new ObjectId(id), newPassword);
      
      if (success) {
        return res.status(200).json({ 
          success: true, 
          message: 'Password updated successfully' 
        });
      } else {
        return res.status(500).json({ success: false, error: 'Failed to update password' });
      }
    } catch (error) {
      console.error('Error updating password:', error);
      return res.status(500).json({ success: false, error: 'Failed to update password' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
