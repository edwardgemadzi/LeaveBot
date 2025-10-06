import jwt from 'jsonwebtoken';
import { 
  JWT_SECRET, 
  getAllTeams, 
  getTeamById,
  createTeam,
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/teams - List all teams
  if (req.method === 'GET') {
    const auth = authenticateAndAuthorize(req);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, error: auth.error });
    }

    try {
      const teams = await getAllTeams();
      
      // Get member counts for each team
      const teamsWithMembers = await Promise.all(
        teams.map(async (team) => {
          const members = await getUsersByTeam(team._id);
          return {
            ...team,
            id: team._id.toString(),
            memberCount: members.length
          };
        })
      );
      
      return res.status(200).json({ success: true, teams: teamsWithMembers });
    } catch (error) {
      console.error('Error fetching teams:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch teams' });
    }
  }

  // POST /api/teams - Create new team (admin only)
  if (req.method === 'POST') {
    const auth = authenticateAndAuthorize(req, ['admin']);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, error: auth.error });
    }

    try {
      const { name, description, leaderId } = req.body;

      if (!name) {
        return res.status(400).json({ 
          success: false, 
          error: 'Team name is required' 
        });
      }

      const teamData = {
        name,
        description: description || '',
        leaderId: leaderId ? new ObjectId(leaderId) : null
      };

      const newTeam = await createTeam(teamData);
      
      return res.status(201).json({ 
        success: true, 
        message: 'Team created successfully',
        team: {
          ...newTeam,
          id: newTeam._id.toString()
        }
      });
    } catch (error) {
      console.error('Error creating team:', error);
      
      // Handle duplicate team name
      if (error.code === 11000) {
        return res.status(400).json({ 
          success: false, 
          error: 'Team name already exists' 
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create team' 
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
