import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, addUser, getUserByUsername, initializeAdmin } from './shared/mongodb-storage.js';

// Initialize admin on cold start
initializeAdmin();

// Input validation
function validateUserInput(data) {
  const { username, password, name } = data;
  
  if (!username || !password) {
    return { valid: false, error: 'Username and password are required' };
  }
  
  if (typeof username !== 'string' || typeof password !== 'string') {
    return { valid: false, error: 'Invalid input format' };
  }
  
  if (username.length < 3 || username.length > 50) {
    return { valid: false, error: 'Username must be 3-50 characters' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  const sanitizedData = {
    username: username.trim(),
    password: password,
    name: name ? String(name).trim().substring(0, 100) : username
  };
  
  return { valid: true, data: sanitizedData };
}

export default async function handler(req, res) {
  // Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password, name, teamId } = req.body;
  
  // Validate input
  const validation = validateUserInput({ username, password, name });
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  
  const { username: validUsername, password: validPassword, name: validName } = validation.data;
  
  // Check if user already exists
  const existingUser = await getUserByUsername(validUsername);
  if (existingUser) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(validPassword, 10);
  
  // Create user using helper (will auto-assign admin if first user)
  const userData = {
    username: validUsername,
    passwordHash,
    name: validName
  };
  
  // Add teamId if provided
  if (teamId) {
    const { ObjectId } = await import('mongodb');
    userData.teamId = new ObjectId(teamId);
  }
  
  const newUser = await addUser(userData);
  
  // Generate JWT token
  const token = jwt.sign(
    { 
      id: newUser._id, 
      username: newUser.username, 
      role: newUser.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return res.json({
    success: true,
    user: { 
      id: newUser._id, 
      username: newUser.username, 
      name: newUser.name, 
      role: newUser.role 
    },
    token,
    message: newUser.role === 'admin' ? 'First user created as admin' : 'User registered successfully'
  });
}
