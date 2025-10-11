import { connectToDatabase } from '../lib/db.js';
import { hashPassword, generateToken, createUserPayload, verifyTeamToken } from '../lib/auth.js';
import { validateUsername, validatePassword, validateName, validateRole, validateTeamName } from '../lib/validators.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { username, password, name, role, teamToken, teamName } = req.body;

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

    // Connect to database
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

    let teamId = null;

    // Handle team assignment based on role
    if (roleValidation.value === 'leader') {
      // Leaders need to provide team name and will create a new team
      if (!teamName) {
        return res.status(400).json({
          success: false,
          error: 'Team name is required for team leaders'
        });
      }

      const teamNameValidation = validateTeamName(teamName);
      if (!teamNameValidation.valid) {
        return res.status(400).json({
          success: false,
          error: teamNameValidation.error
        });
      }

      // Check if team name already exists
      const existingTeam = await teamsCollection.findOne({
        name: teamNameValidation.value
      });

      if (existingTeam) {
        return res.status(409).json({
          success: false,
          error: 'Team name already exists'
        });
      }

    } else if (roleValidation.value === 'user') {
      // Users need a team token to join an existing team
      if (!teamToken) {
        return res.status(400).json({
          success: false,
          error: 'Team token is required for team members'
        });
      }

      try {
        const tokenData = verifyTeamToken(teamToken);
        teamId = tokenData.teamId;
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired team token'
        });
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
      teamId: teamId,
      createdAt: new Date()
    };

    const userResult = await usersCollection.insertOne(newUser);
    const createdUser = { _id: userResult.insertedId, ...newUser };

    // Handle team creation for leaders
    if (roleValidation.value === 'leader' && teamName) {
      const newTeam = {
        name: teamNameValidation.value,
        description: `Team managed by ${nameValidation.value}`,
        leaderId: userResult.insertedId,
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
      
      // Update user with team ID
      await usersCollection.updateOne(
        { _id: userResult.insertedId },
        { $set: { teamId: teamResult.insertedId } }
      );

      createdUser.teamId = teamResult.insertedId;
    }

    // Create user payload for token
    const userPayload = createUserPayload(createdUser);

    // Generate JWT token
    const token = generateToken(userPayload);

    // Return success response
    res.status(201).json({
      success: true,
      data: {
        token,
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
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
