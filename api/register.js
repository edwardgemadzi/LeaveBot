import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { users, JWT_SECRET, addUser, getUserByUsername, initializeAdmin } from './shared/storage.js';

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

  const { username, password, name } = req.body;
  
  // Validate input
  const validation = validateUserInput({ username, password, name });
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  
  const { username: validUsername, password: validPassword, name: validName } = validation.data;
  
  // Check if user already exists
  const existingUser = getUserByUsername(validUsername);
  if (existingUser) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  
  // If this is the first user, make them admin
  const isFirstUser = users.length === 0;
  
  // Hash password
  const passwordHash = await bcrypt.hash(validPassword, 10);
  
  // Create user using helper
  const newUser = addUser({
    username: validUsername,
    passwordHash,
    name: validName,
    role: isFirstUser ? 'admin' : 'user'
  });
  
  // Generate JWT token
  const token = jwt.sign(
    { 
      id: newUser.id, 
      username: newUser.username, 
      role: newUser.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return res.json({
    success: true,
    user: { 
      id: newUser.id, 
      username: newUser.username, 
      name: newUser.name, 
      role: newUser.role 
    },
    token,
    message: isFirstUser ? 'First user created as admin' : 'User registered successfully'
  });
}
