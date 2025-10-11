import { connectToDatabase } from '../lib/db.js';
import { comparePassword, generateToken, createUserPayload } from '../lib/auth.js';
import { validateUsername, validatePassword } from '../lib/validators.js';

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
    const { username, password } = req.body;

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

    // Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Find user by username
    const user = await usersCollection.findOne({
      username: usernameValidation.value
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      passwordValidation.value,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Create user payload for token
    const userPayload = createUserPayload(user);

    // Generate JWT token
    const token = generateToken(userPayload);

    // Return success response
    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id.toString(),
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          teamId: user.teamId?.toString(),
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
