import jwt from 'jsonwebtoken'
import { 
  JWT_SECRET, 
  getAllTeams, 
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  getUsersByTeam,
  assignUserToTeam,
  removeUserFromTeam
} from './shared/mongodb-storage.js'
import { ObjectId } from 'mongodb'

// Helper to verify JWT and check permissions
function authenticateAndAuthorize(req, requiredRoles = []) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized', status: 401 }
  }

  try {
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET)
    
    if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
      return { error: 'Forbidden: Insufficient permissions', status: 403 }
    }
    
    return { user: decoded }
  } catch (err) {
    return { error: 'Invalid or expired token', status: 401 }
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { id, action } = req.query

  // GET /api/teams - List all teams
  // GET /api/teams?id=xxx - Get specific team with members
  if (req.method === 'GET') {
    const auth = authenticateAndAuthorize(req)
    if (auth.error) {
      return res.status(auth.status).json({ success: false, error: auth.error })
    }

    try {
      if (id) {
        // Get specific team
        const team = await getTeamById(new ObjectId(id))
        if (!team) {
          return res.status(404).json({ success: false, error: 'Team not found' })
        }

        const members = await getUsersByTeam(new ObjectId(id))
        
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
        })
      } else {
        // Get all teams
        const teams = await getAllTeams()
        
        // Get member counts for each team
        const teamsWithMembers = await Promise.all(
          teams.map(async (team) => {
            const members = await getUsersByTeam(team._id)
            return {
              ...team,
              id: team._id.toString(),
              memberCount: members.length
            }
          })
        )
        
        return res.status(200).json({ success: true, teams: teamsWithMembers })
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch teams' })
    }
  }

  // POST /api/teams - Create new team
  // POST /api/teams?id=xxx&action=assign - Assign user to team
  // POST /api/teams?id=xxx&action=remove - Remove user from team
  if (req.method === 'POST') {
    if (id && action === 'assign') {
      // Assign user to team
      const auth = authenticateAndAuthorize(req, ['admin'])
      if (auth.error) {
        return res.status(auth.status).json({ success: false, error: auth.error })
      }

      try {
        const { userId } = req.body

        if (!userId) {
          return res.status(400).json({ success: false, error: 'User ID is required' })
        }

        if (!ObjectId.isValid(id) || !ObjectId.isValid(userId)) {
          return res.status(400).json({ success: false, error: 'Invalid ID format' })
        }

        const success = await assignUserToTeam(new ObjectId(userId), new ObjectId(id))
        
        if (success) {
          return res.status(200).json({ success: true, message: 'User assigned to team successfully' })
        } else {
          return res.status(500).json({ success: false, error: 'Failed to assign user to team' })
        }
      } catch (error) {
        console.error('Error assigning user to team:', error)
        return res.status(500).json({ success: false, error: error.message || 'Failed to assign user to team' })
      }
    } else if (id && action === 'remove') {
      // Remove user from team
      const auth = authenticateAndAuthorize(req, ['admin'])
      if (auth.error) {
        return res.status(auth.status).json({ success: false, error: auth.error })
      }

      try {
        const { userId } = req.body

        if (!userId) {
          return res.status(400).json({ success: false, error: 'User ID is required' })
        }

        if (!ObjectId.isValid(id) || !ObjectId.isValid(userId)) {
          return res.status(400).json({ success: false, error: 'Invalid ID format' })
        }

        const success = await removeUserFromTeam(new ObjectId(userId))
        
        if (success) {
          return res.status(200).json({ success: true, message: 'User removed from team successfully' })
        } else {
          return res.status(500).json({ success: false, error: 'Failed to remove user from team' })
        }
      } catch (error) {
        console.error('Error removing user from team:', error)
        return res.status(500).json({ success: false, error: error.message || 'Failed to remove user from team' })
      }
    } else {
      // Create new team
      const auth = authenticateAndAuthorize(req, ['admin'])
      if (auth.error) {
        return res.status(auth.status).json({ success: false, error: auth.error })
      }

      try {
        const { name, description, leaderId } = req.body

        if (!name) {
          return res.status(400).json({ 
            success: false, 
            error: 'Team name is required' 
          })
        }

        const teamData = {
          name,
          description: description || '',
          leaderId: leaderId ? new ObjectId(leaderId) : null
        }

        const newTeam = await createTeam(teamData)
        
        return res.status(201).json({ 
          success: true, 
          message: 'Team created successfully',
          team: {
            ...newTeam,
            id: newTeam._id.toString()
          }
        })
      } catch (error) {
        console.error('Error creating team:', error)
        
        if (error.code === 11000) {
          return res.status(400).json({ 
            success: false, 
            error: 'Team name already exists' 
          })
        }
        
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to create team' 
        })
      }
    }
  }

  // PUT /api/teams?id=xxx - Update team
  if (req.method === 'PUT') {
    const auth = authenticateAndAuthorize(req, ['admin'])
    if (auth.error) {
      return res.status(auth.status).json({ success: false, error: auth.error })
    }

    if (!id) {
      return res.status(400).json({ success: false, error: 'Team ID is required' })
    }

    try {
      const updates = req.body

      if (updates.leaderId) {
        updates.leaderId = new ObjectId(updates.leaderId)
      }

      const success = await updateTeam(new ObjectId(id), updates)
      
      if (success) {
        return res.status(200).json({ success: true, message: 'Team updated successfully' })
      } else {
        return res.status(500).json({ success: false, error: 'Failed to update team' })
      }
    } catch (error) {
      console.error('Error updating team:', error)
      return res.status(500).json({ success: false, error: 'Failed to update team' })
    }
  }

  // DELETE /api/teams?id=xxx - Delete team
  if (req.method === 'DELETE') {
    const auth = authenticateAndAuthorize(req, ['admin'])
    if (auth.error) {
      return res.status(auth.status).json({ success: false, error: auth.error })
    }

    if (!id) {
      return res.status(400).json({ success: false, error: 'Team ID is required' })
    }

    try {
      const success = await deleteTeam(new ObjectId(id))
      
      if (success) {
        return res.status(200).json({ success: true, message: 'Team deleted successfully' })
      } else {
        return res.status(500).json({ success: false, error: 'Failed to delete team' })
      }
    } catch (error) {
      console.error('Error deleting team:', error)
      return res.status(500).json({ success: false, error: 'Failed to delete team' })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
