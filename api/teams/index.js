import { connectToDatabase } from '../lib/db.js';
import { requireAuth, generateTeamToken } from '../lib/auth.js';
import { validateObjectId, validateTeamName, validateWorkingDays } from '../lib/validators.js';

// GET /api/teams - List teams
async function handleGetTeams(req, res) {
  try {
    const { db } = await connectToDatabase();
    const teamsCollection = db.collection('teams');
    const usersCollection = db.collection('users');

    let query = {};

    // Leaders can only see their own team
    if (req.user.role === 'leader') {
      query.leaderId = req.user.id;
    }

    const teams = await teamsCollection.find(query).toArray();

    // Get team details with member counts
    const teamsWithDetails = await Promise.all(
      teams.map(async (team) => {
        const memberCount = await usersCollection.countDocuments({
          teamId: team._id,
          role: 'user'
        });

        const leader = await usersCollection.findOne({ _id: team.leaderId });

        return {
          _id: team._id.toString(),
          name: team.name,
          description: team.description,
          leaderId: team.leaderId?.toString(),
          leaderName: leader?.name || 'Unassigned',
          memberCount,
          settings: team.settings,
          createdAt: team.createdAt
        };
      })
    );

    res.status(200).json({
      success: true,
      data: { teams: teamsWithDetails }
    });

  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// POST /api/teams - Create team
async function handleCreateTeam(req, res) {
  try {
    const { name, description, leaderId } = req.body;

    // Only admins can create teams
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can create teams'
      });
    }

    const nameValidation = validateTeamName(name);
    if (!nameValidation.valid) {
      return res.status(400).json({
        success: false,
        error: nameValidation.error
      });
    }

    const { db } = await connectToDatabase();
    const teamsCollection = db.collection('teams');
    const usersCollection = db.collection('users');

    // Check if team name already exists
    const existingTeam = await teamsCollection.findOne({
      name: nameValidation.value
    });

    if (existingTeam) {
      return res.status(409).json({
        success: false,
        error: 'Team name already exists'
      });
    }

    // Validate leader if provided
    let assignedLeaderId = null;
    if (leaderId) {
      const leaderValidation = validateObjectId(leaderId);
      if (!leaderValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid leader ID'
        });
      }

      const leader = await usersCollection.findOne({ _id: leaderValidation.value });
      if (!leader || leader.role !== 'leader') {
        return res.status(400).json({
          success: false,
          error: 'Invalid leader or user is not a leader'
        });
      }

      assignedLeaderId = leaderValidation.value;
    }

    // Create team
    const newTeam = {
      name: nameValidation.value,
      description: description || '',
      leaderId: assignedLeaderId,
      memberIds: [],
      settings: {
        annualLeaveDays: 21,
        requireApproval: true,
        maxConcurrentLeave: 3,
        workingDays: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false
        }
      },
      createdAt: new Date()
    };

    const result = await teamsCollection.insertOne(newTeam);

    res.status(201).json({
      success: true,
      data: {
        team: {
          _id: result.insertedId.toString(),
          name: newTeam.name,
          description: newTeam.description,
          leaderId: newTeam.leaderId?.toString(),
          settings: newTeam.settings,
          createdAt: newTeam.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// PUT /api/teams/:id - Update team
async function handleUpdateTeam(req, res) {
  try {
    const { id } = req.query;
    const { name, description, leaderId, settings } = req.body;

    const idValidation = validateObjectId(id);
    if (!idValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid team ID'
      });
    }

    const { db } = await connectToDatabase();
    const teamsCollection = db.collection('teams');
    const usersCollection = db.collection('users');

    // Check if team exists
    const team = await teamsCollection.findOne({ _id: idValidation.value });
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    // Check permissions
    if (req.user.role === 'leader' && team.leaderId?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Can only update your own team'
      });
    }

    // Build update object
    const updateData = {};

    if (name !== undefined) {
      const nameValidation = validateTeamName(name);
      if (!nameValidation.valid) {
        return res.status(400).json({
          success: false,
          error: nameValidation.error
        });
      }

      // Check if new name conflicts
      if (nameValidation.value !== team.name) {
        const existingTeam = await teamsCollection.findOne({
          name: nameValidation.value
        });
        if (existingTeam) {
          return res.status(409).json({
            success: false,
            error: 'Team name already exists'
          });
        }
      }

      updateData.name = nameValidation.value;
    }

    if (description !== undefined) {
      updateData.description = description || '';
    }

    if (leaderId !== undefined) {
      if (leaderId) {
        const leaderValidation = validateObjectId(leaderId);
        if (!leaderValidation.valid) {
          return res.status(400).json({
            success: false,
            error: 'Invalid leader ID'
          });
        }

        const leader = await usersCollection.findOne({ _id: leaderValidation.value });
        if (!leader || leader.role !== 'leader') {
          return res.status(400).json({
            success: false,
            error: 'Invalid leader or user is not a leader'
          });
        }

        updateData.leaderId = leaderValidation.value;
      } else {
        updateData.leaderId = null;
      }
    }

    if (settings !== undefined) {
      if (settings.workingDays) {
        const workingDaysValidation = validateWorkingDays(settings.workingDays);
        if (!workingDaysValidation.valid) {
          return res.status(400).json({
            success: false,
            error: workingDaysValidation.error
          });
        }
      }

      updateData.settings = {
        ...team.settings,
        ...settings
      };
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid update fields provided'
      });
    }

    // Update team
    await teamsCollection.updateOne(
      { _id: idValidation.value },
      { $set: updateData }
    );

    // Get updated team
    const updatedTeam = await teamsCollection.findOne({ _id: idValidation.value });

    res.status(200).json({
      success: true,
      data: {
        team: {
          _id: updatedTeam._id.toString(),
          name: updatedTeam.name,
          description: updatedTeam.description,
          leaderId: updatedTeam.leaderId?.toString(),
          settings: updatedTeam.settings,
          createdAt: updatedTeam.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// DELETE /api/teams/:id - Delete team
async function handleDeleteTeam(req, res) {
  try {
    const { id } = req.query;

    const idValidation = validateObjectId(id);
    if (!idValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid team ID'
      });
    }

    // Only admins can delete teams
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can delete teams'
      });
    }

    const { db } = await connectToDatabase();
    const teamsCollection = db.collection('teams');
    const usersCollection = db.collection('users');
    const leavesCollection = db.collection('leaves');

    // Check if team exists
    const team = await teamsCollection.findOne({ _id: idValidation.value });
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    // Get all users in this team
    const teamUsers = await usersCollection.find({ teamId: idValidation.value }).toArray();
    const teamUserIds = teamUsers.map(u => u._id);

    // Delete all leave requests for users in this team
    if (teamUserIds.length > 0) {
      await leavesCollection.deleteMany({ userId: { $in: teamUserIds } });
    }

    // Unassign all users from this team
    await usersCollection.updateMany(
      { teamId: idValidation.value },
      { $unset: { teamId: "" } }
    );

    // Delete the team
    await teamsCollection.deleteOne({ _id: idValidation.value });

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully'
    });

  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// GET /api/teams/:id/token - Generate team registration token
async function handleGenerateToken(req, res) {
  try {
    const { id } = req.query;

    const idValidation = validateObjectId(id);
    if (!idValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid team ID'
      });
    }

    const { db } = await connectToDatabase();
    const teamsCollection = db.collection('teams');

    // Check if team exists
    const team = await teamsCollection.findOne({ _id: idValidation.value });
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    // Check permissions
    if (req.user.role === 'leader' && team.leaderId?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Can only generate tokens for your own team'
      });
    }

    // Generate team token
    const teamToken = generateTeamToken(
      team._id.toString(),
      team.name,
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: {
        teamToken,
        teamName: team.name,
        expiresIn: '30 days'
      }
    });

  } catch (error) {
    console.error('Generate token error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// Main handler
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Require authentication for all endpoints
  const authenticatedHandler = requireAuth(async (req, res) => {
    const { id, action } = req.query;

    try {
      if (req.method === 'GET') {
        if (action === 'token' && id) {
          return await handleGenerateToken(req, res);
        } else {
          return await handleGetTeams(req, res);
        }
      } else if (req.method === 'POST') {
        return await handleCreateTeam(req, res);
      } else if (req.method === 'PUT') {
        return await handleUpdateTeam(req, res);
      } else if (req.method === 'DELETE') {
        return await handleDeleteTeam(req, res);
      } else {
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
      }
    } catch (error) {
      console.error('Teams API error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  return authenticatedHandler(req, res);
}
