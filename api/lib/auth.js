import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = '24h';

// Hash password
export async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

// Compare password
export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Extract token from Authorization header
export function extractToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  return authHeader.substring(7);
}

// Middleware to verify authentication
export function requireAuth(handler) {
  return async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = extractToken(authHeader);
      const decoded = verifyToken(token);
      
      // Add user info to request
      req.user = decoded;
      
      return await handler(req, res);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: ' + error.message
      });
    }
  };
}

// Middleware to require specific role
export function requireRole(allowedRoles) {
  return (handler) => {
    return requireAuth(async (req, res) => {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }
      return await handler(req, res);
    });
  };
}

// Generate team registration token
export function generateTeamToken(teamId, teamName, generatedBy) {
  return jwt.sign(
    {
      teamId,
      teamName,
      type: 'team_registration',
      generatedBy,
      generatedAt: new Date().toISOString()
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Verify team registration token
export function verifyTeamToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'team_registration') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid team token');
  }
}

// Create user payload for JWT
export function createUserPayload(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    name: user.name,
    role: user.role,
    teamId: user.teamId?.toString()
  };
}
