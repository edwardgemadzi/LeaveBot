import { connectToDatabase } from '../lib/db.js';
import { requireAuth, requireRole, hashPassword, createUserPayload } from '../lib/auth.js';
import { validateUsername, validatePassword, validateName, validateRole, validateObjectId } from '../lib/validators.js';

// GET /api/users - List users
async function handleGetUsers(req, res) {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const teamsCollection = db.collection('teams');

    let query = {};

    // Leaders can only see users in their team
    if (req.user.role === 'leader') {
      const team = await teamsCollection.findOne({ leaderId: req.user.id });
      if (team) {
        query.teamId = team._id;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Leader not assigned to any team'
        });
      }
    }

    const users = await usersCollection.find(query).toArray();
    
    // Remove password hashes from response
    const safeUsers = users.map(user => ({
      _id: user._id.toString(),
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      teamId: user.teamId?.toString(),
      createdAt: user.createdAt
    }));

    res.status(200).json({
      success: true,
      data: { users: safeUsers }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// POST /api/users - Create user
async function handleCreateUser(req, res) {
  try {
    const { username, password, name, role, teamId } = req.body;

    // Validate input
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return res.status(400).json({
        success: false,
        error: usernameValidation.error
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.error
      });
    }

    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return res.status(400).json({
        success: false,
        error: nameValidation.error
      });
    }

    const roleValidation = validateRole(role);
    if (!roleValidation.valid) {
      return res.status(400).json({
        success: false,
        error: roleValidation.error
      });
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const teamsCollection = db.collection('teams');

    // Check if username already exists
    const existingUser = await usersCollection.findOne({
      username: usernameValidation.value
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Username already exists'
      });
    }

    // Determine team assignment
    let assignedTeamId = null;

    if (roleValidation.value === 'leader') {
      // Create new team for leader
      const newTeam = {
        name: `${nameValidation.value}'s Team`,
        description: `Team managed by ${nameValidation.value}`,
        leaderId: null, // Will be set after user creation
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

      const teamResult = await teamsCollection.insertOne(newTeam);
      assignedTeamId = teamResult.insertedId;

    } else if (roleValidation.value === 'user') {
      // Assign to leader's team or specified team
      if (req.user.role === 'leader') {
        const team = await teamsCollection.findOne({ leaderId: req.user.id });
        if (team) {
          assignedTeamId = team._id;
        } else {
          return res.status(400).json({
            success: false,
            error: 'Leader not assigned to any team'
          });
        }
      } else if (teamId) {
        const teamValidation = validateObjectId(teamId);
        if (!teamValidation.valid) {
          return res.status(400).json({
            success: false,
            error: 'Invalid team ID'
          });
        }
        assignedTeamId = teamValidation.value;
      }
    }

    // Hash password
    const passwordHash = await hashPassword(passwordValidation.value);

    // Create user
    const newUser = {
      username: usernameValidation.value,
      passwordHash,
      name: nameValidation.value,
      role: roleValidation.value,
      teamId: assignedTeamId,
      createdAt: new Date()
    };

    const userResult = await usersCollection.insertOne(newUser);
    const createdUser = { _id: userResult.insertedId, ...newUser };

    // Update team if this is a leader
    if (roleValidation.value === 'leader' && assignedTeamId) {
      await teamsCollection.updateOne(
        { _id: assignedTeamId },
        { $set: { leaderId: userResult.insertedId } }
      );
    }

    // Add to team members if regular user
    if (roleValidation.value === 'user' && assignedTeamId) {
      await teamsCollection.updateOne(
        { _id: assignedTeamId },
        { $addToSet: { memberIds: userResult.insertedId } }
      );
    }

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: createdUser._id.toString(),
          username: createdUser.username,
          name: createdUser.name,
          role: createdUser.role,
          teamId: createdUser.teamId?.toString(),
          createdAt: createdUser.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// PUT /api/users/:id - Update user
async function handleUpdateUser(req, res) {
  try {
    const { id } = req.query;
    const { name, email, role, teamId } = req.body;

    const idValidation = validateObjectId(id);
    if (!idValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Check if user exists
    const existingUser = await usersCollection.findOne({ _id: idValidation.value });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Build update object
    const updateData = {};

    if (name !== undefined) {
      const nameValidation = validateName(name);
      if (!nameValidation.valid) {
        return res.status(400).json({
          success: false,
          error: nameValidation.error
        });
      }
      updateData.name = nameValidation.value;
    }

    if (email !== undefined) {
      updateData.email = email || null;
    }

    if (role !== undefined) {
      const roleValidation = validateRole(role);
      if (!roleValidation.valid) {
        return res.status(400).json({
          success: false,
          error: roleValidation.error
        });
      }
      updateData.role = roleValidation.value;
    }

    if (teamId !== undefined) {
      if (teamId) {
        const teamValidation = validateObjectId(teamId);
        if (!teamValidation.valid) {
          return res.status(400).json({
            success: false,
            error: 'Invalid team ID'
          });
        }
        updateData.teamId = teamValidation.value;
      } else {
        updateData.teamId = null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid update fields provided'
      });
    }

    // Update user
    await usersCollection.updateOne(
      { _id: idValidation.value },
      { $set: updateData }
    );

    // Get updated user
    const updatedUser = await usersCollection.findOne({ _id: idValidation.value });

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: updatedUser._id.toString(),
          username: updatedUser.username,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          teamId: updatedUser.teamId?.toString(),
          createdAt: updatedUser.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// DELETE /api/users/:id - Delete user
async function handleDeleteUser(req, res) {
  try {
    const { id } = req.query;

    const idValidation = validateObjectId(id);
    if (!idValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const teamsCollection = db.collection('teams');
    const leavesCollection = db.collection('leaves');

    // Check if user exists
    const user = await usersCollection.findOne({ _id: idValidation.value });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    // Delete user's leave requests
    await leavesCollection.deleteMany({ userId: idValidation.value });

    // Remove from team if applicable
    if (user.teamId) {
      await teamsCollection.updateOne(
        { _id: user.teamId },
        { $pull: { memberIds: idValidation.value } }
      );
    }

    // Delete user
    await usersCollection.deleteOne({ _id: idValidation.value });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// PUT /api/users/:id/password - Change password
async function handleChangePassword(req, res) {
  try {
    const { id } = req.query;
    const { password } = req.body;

    const idValidation = validateObjectId(id);
    if (!idValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.error
      });
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Check if user exists
    const user = await usersCollection.findOne({ _id: idValidation.value });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Hash new password
    const passwordHash = await hashPassword(passwordValidation.value);

    // Update password
    await usersCollection.updateOne(
      { _id: idValidation.value },
      { $set: { passwordHash } }
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
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
        return await handleGetUsers(req, res);
      } else if (req.method === 'POST') {
        // Only admins and leaders can create users
        if (!['admin', 'leader'].includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions'
          });
        }
        return await handleCreateUser(req, res);
      } else if (req.method === 'PUT') {
        if (action === 'password') {
          return await handleChangePassword(req, res);
        } else {
          // Only admins can update users
          if (req.user.role !== 'admin') {
            return res.status(403).json({
              success: false,
              error: 'Insufficient permissions'
            });
          }
          return await handleUpdateUser(req, res);
        }
      } else if (req.method === 'DELETE') {
        // Only admins can delete users
        if (req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions'
          });
        }
        return await handleDeleteUser(req, res);
      } else {
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
      }
    } catch (error) {
      console.error('Users API error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  return authenticatedHandler(req, res);
}
