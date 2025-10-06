import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, getUserByUsername, initializeAdmin } from './shared/mongodb-storage.js';
import { logger } from './shared/logger.js';
import { validateUsername, validatePassword } from './shared/validators.js';

// Initialize admin on cold start
initializeAdmin();

// Rate limiting (simple in-memory implementation)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(username) {
  const now = Date.now();
  const attempts = loginAttempts.get(username) || { count: 0, firstAttempt: now, lockedUntil: 0 };
  
  // Check if user is locked out
  if (attempts.lockedUntil > now) {
    const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000 / 60);
    return { allowed: false, message: `Account locked. Try again in ${remainingTime} minutes.` };
  }
  
  // Reset counter if first attempt was more than 15 minutes ago
  if (now - attempts.firstAttempt > LOCKOUT_TIME) {
    attempts.count = 0;
    attempts.firstAttempt = now;
  }
  
  return { allowed: true, attempts };
}

function recordFailedAttempt(username) {
  const now = Date.now();
  const attempts = loginAttempts.get(username) || { count: 0, firstAttempt: now, lockedUntil: 0 };
  attempts.count++;
  
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockedUntil = now + LOCKOUT_TIME;
  }
  
  loginAttempts.set(username, attempts);
}

function clearAttempts(username) {
  loginAttempts.delete(username);
}

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
  const rateCheck = checkRateLimit(usernameValidation.value);
  if (!rateCheck.allowed) {
    logger.warn('Rate limit exceeded for login', { username: usernameValidation.value, ip: req.headers['x-forwarded-for'] });
    return res.status(429).json({ error: rateCheck.message });
  }
  
  // Find user
  const user = await getUserByUsername(usernameValidation.value);
  
  if (!user) {
    // Prevent username enumeration - same delay as password check
    await bcrypt.compare(passwordValidation.value, '$2a$10$8K1p/a0dL3LkkPzSs/T3GOu7IqxYpU0Zy0qQZvzNqZNMkWXLrQGRW');
    recordFailedAttempt(usernameValidation.value);
    logger.warn('Failed login attempt - user not found', { username: usernameValidation.value, ip: req.headers['x-forwarded-for'] });
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Verify password with bcrypt
  const isValidPassword = await bcrypt.compare(passwordValidation.value, user.passwordHash);
  
  if (!isValidPassword) {
    recordFailedAttempt(usernameValidation.value);
    logger.warn('Failed login attempt - invalid password', { username: usernameValidation.value, ip: req.headers['x-forwarded-for'] });
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Clear failed attempts on successful login
  clearAttempts(usernameValidation.value);
  
  // Generate JWT token
  const token = jwt.sign(
    { 
      id: user.id, 
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
    user: { id: user.id, username: user.username, name: user.name, role: user.role },
    token
  });
}
