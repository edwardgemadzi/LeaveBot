import jwt from 'jsonwebtoken';
import { 
  JWT_SECRET, 
  getTeamById,
  updateTeam,
  deleteTeam,
  getUsersByTeam
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Team ID is required' });
  }

  // GET /api/teams/:id - Get team details with members
  if (req.method === 'GET') {
    const auth = authenticateAndAuthorize(req);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, error: auth.error });
    }

    try {
      const team = await getTeamById(new ObjectId(id));
      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found' });
      }

      const members = await getUsersByTeam(new ObjectId(id));
      
      return res.status(200).json({ 
        success: true, 
        team: {
          ...team,
          id: team._id.toString(),
          members: members.map(({ passwordHash, ...user }) => ({
            ...user,
            id: user._id.toString()
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching team:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch team' });
    }
  }

  // PUT /api/teams/:id - Update team (admin only)
  if (req.method === 'PUT') {
    const auth = authenticateAndAuthorize(req, ['admin']);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, error: auth.error });
    }

    try {
      const updates = req.body;

      // Convert leaderId if provided
      if (updates.leaderId) {
        updates.leaderId = new ObjectId(updates.leaderId);
      }

      const success = await updateTeam(new ObjectId(id), updates);
      
      if (success) {
        return res.status(200).json({ success: true, message: 'Team updated successfully' });
      } else {
        return res.status(500).json({ success: false, error: 'Failed to update team' });
      }
    } catch (error) {
      console.error('Error updating team:', error);
      return res.status(500).json({ success: false, error: 'Failed to update team' });
    }
  }

  // DELETE /api/teams/:id - Delete team (admin only)
  if (req.method === 'DELETE') {
    const auth = authenticateAndAuthorize(req, ['admin']);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, error: auth.error });
    }

    try {
      const success = await deleteTeam(new ObjectId(id));
      
      if (success) {
        return res.status(200).json({ success: true, message: 'Team deleted successfully' });
      } else {
        return res.status(500).json({ success: false, error: 'Failed to delete team' });
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      return res.status(500).json({ success: false, error: 'Failed to delete team' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
