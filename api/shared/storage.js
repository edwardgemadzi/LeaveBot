// Shared user storage across all API endpoints
// In production, replace this with a real database (Vercel KV, PostgreSQL, etc.)

// Global user storage (in-memory, shared across imports in same function instance)
export const users = [];

// Shared JWT secret
export const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-immediately';

// Initialize admin from environment if provided
export function initializeAdmin() {
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && users.length === 0) {
    const bcrypt = require('bcryptjs');
    const existingAdmin = users.find(u => u.username === process.env.ADMIN_USERNAME);
    
    if (!existingAdmin) {
      const passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
      users.push({
        id: 1,
        username: process.env.ADMIN_USERNAME,
        passwordHash,
        name: process.env.ADMIN_NAME || 'Administrator',
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      console.log('✅ Initial admin user created from environment variables');
      return true;
    }
  }
  return false;
}

// Call this on module load
initializeAdmin();

// Helper to get user by username
export function getUserByUsername(username) {
  return users.find(u => u.username === username);
}

// Helper to get user by id
export function getUserById(id) {
  return users.find(u => u.id === id);
}

// Helper to add new user
export function addUser(userData) {
  const newUser = {
    id: users.length + 1,
    ...userData,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  return newUser;
}

// WARNING: In-memory storage limitations
console.log('⚠️  Using in-memory storage. Data will be lost on function restart.');
console.log('⚠️  For production, use Vercel KV, PostgreSQL, or another database.');
