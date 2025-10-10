import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, getUserByUsername, initializeAdmin } from '../lib/shared/mongodb-storage.js';
import { rateLimiters } from '../lib/shared/rate-limiter.js';
import { logger } from '../lib/shared/logger.js';
import { validateUsername, validatePassword } from '../lib/shared/validators.js';

// Initialize admin on cold start
initializeAdmin();

// Use standardized rate limiting for authentication

export default async function handler(req, res) {
  const startTime = Date.now();
  
  // Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = req.body;
  
  // Input validation using validators
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    logger.warn('Login attempt with invalid username', { error: usernameValidation.error });
    return res.status(400).json({ error: usernameValidation.error });
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    logger.warn('Login attempt with invalid password', { error: passwordValidation.error });
    return res.status(400).json({ error: passwordValidation.error });
  }
  
  // Check rate limiting
  const rateLimit = rateLimiters.auth(req, usernameValidation.value);
  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded for login', { username: usernameValidation.value, ip: req.headers['x-forwarded-for'] });
    return res.status(429).json({ success: false, error: rateLimit.message });
  }
  
  // Find user
  const userResult = await getUserByUsername(usernameValidation.value);
  
  if (!userResult.success || !userResult.data) {
    // Prevent username enumeration - same delay as password check
    await bcrypt.compare(passwordValidation.value, '$2a$10$8K1p/a0dL3LkkPzSs/T3GOu7IqxYpU0Zy0qQZvzNqZNMkWXLrQGRW');
    logger.warn('Failed login attempt - user not found', { username: usernameValidation.value, ip: req.headers['x-forwarded-for'] });
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  const user = userResult.data;
  
  // Verify password with bcrypt
  const isValidPassword = await bcrypt.compare(passwordValidation.value, user.passwordHash);
  
  if (!isValidPassword) {
    logger.warn('Failed login attempt - invalid password', { username: usernameValidation.value, ip: req.headers['x-forwarded-for'] });
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Successful login
  
  // Generate JWT token
  const token = jwt.sign(
    { 
      id: user._id.toString(), 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  logger.info('Successful login', { 
    username: user.username, 
    role: user.role, 
    ip: req.headers['x-forwarded-for'] 
  });

  const duration = Date.now() - startTime;
  logger.response(req, res, duration);

  return res.json({
    success: true,
    user: { id: user._id.toString(), username: user.username, name: user.name, role: user.role },
    token
  });
}
