import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { 
  JWT_SECRET, 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  createUser
} from './shared/mongodb-storage.js'
import { ObjectId } from 'mongodb'

// Helper to verify JWT and check permissions
function authenticateAndAuthorize(req, requiredRoles = []) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized', status: 401 }
  }

  try {
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET)
    
    if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
      return { error: 'Forbidden: Insufficient permissions', status: 403 }
    }
    
    return { user: decoded }
  } catch (err) {
    return { error: 'Invalid or expired token', status: 401 }
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { id } = req.query

  // GET /api/users - List all users
  // GET /api/users?id=xxx - Get specific user
  if (req.method === 'GET') {
    const auth = authenticateAndAuthorize(req, ['admin', 'leader'])
    if (auth.error) {
      return res.status(auth.status).json({ success: false, error: auth.error })
    }

    try {
      if (id) {
        // Get specific user
        const user = await getUserById(new ObjectId(id))
        if (!user) {
          return res.status(404).json({ success: false, error: 'User not found' })
        }
        
        // Leaders cannot view admins
        if (auth.user.role === 'leader' && user.role === 'admin') {
          return res.status(403).json({ success: false, error: 'Access denied' })
        }
        
        const { passwordHash, ...safeUser } = user
        return res.status(200).json({ success: true, user: { ...safeUser, id: user._id.toString() } })
      } else {
        // Get all users
        const users = await getAllUsers()
        
        // Leaders can only see users and other leaders, not admins
        let filteredUsers = users
        if (auth.user.role === 'leader') {
          filteredUsers = users.filter(u => u.role !== 'admin')
        }
        
        // Remove password hashes from response
        const safeUsers = filteredUsers.map(({ passwordHash, ...user }) => ({
          ...user,
          id: user._id.toString()
        }))
        
        return res.status(200).json({ success: true, users: safeUsers })
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch users' })
    }
  }

  // POST /api/users - Create new user (admin and leader can create)
  if (req.method === 'POST') {
    const auth = authenticateAndAuthorize(req, ['admin', 'leader'])
    if (auth.error) {
      return res.status(auth.status).json({ success: false, error: auth.error })
    }

    try {
      const { username, password, name, role, teamId } = req.body

      if (!username || !password || !name) {
        return res.status(400).json({ 
          success: false, 
          error: 'Username, password, and name are required' 
        })
      }

      // Leaders can only create regular users
      if (auth.user.role === 'leader' && role && role !== 'user') {
        return res.status(403).json({ 
          success: false, 
          error: 'Leaders can only create regular users' 
        })
      }

      // Check if username already exists
      const users = await getAllUsers()
      const existingUser = users.find(u => u.username === username)
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: 'Username already exists' 
        })
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10)

      // Create user
      const newUser = {
        username,
        passwordHash,
        name,
        role: role || 'user',
        teamId: teamId || null,
        createdAt: new Date()
      }

      const userId = await createUser(newUser)
      
      return res.status(201).json({ 
        success: true, 
        message: 'User created successfully',
        userId: userId.toString()
      })
    } catch (error) {
      console.error('Error creating user:', error)
      return res.status(500).json({ success: false, error: 'Failed to create user' })
    }
  }

  // PUT /api/users?id=xxx - Update user
  if (req.method === 'PUT') {
    const auth = authenticateAndAuthorize(req, ['admin', 'leader'])
    if (auth.error) {
      return res.status(auth.status).json({ success: false, error: auth.error })
    }

    if (!id) {
      return res.status(400).json({ success: false, error: 'User ID is required' })
    }

    try {
      const updates = req.body

      // Get the user being updated
      const targetUser = await getUserById(new ObjectId(id))
      if (!targetUser) {
        return res.status(404).json({ success: false, error: 'User not found' })
      }

      // Leaders cannot update admins or other leaders
      if (auth.user.role === 'leader' && targetUser.role !== 'user') {
        return res.status(403).json({ 
          success: false, 
          error: 'Leaders can only manage regular users' 
        })
      }

      // Leaders cannot promote users
      if (auth.user.role === 'leader' && updates.role && updates.role !== 'user') {
        return res.status(403).json({ 
          success: false, 
          error: 'Leaders cannot change user roles' 
        })
      }

      // Prevent self-demotion
      if (id === auth.user.id && updates.role && updates.role !== auth.user.role) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot change your own role' 
        })
      }

      // If password is being updated, hash it
      if (updates.password) {
        updates.passwordHash = await bcrypt.hash(updates.password, 10)
        delete updates.password
      }

      const success = await updateUser(new ObjectId(id), updates)
      
      if (success) {
        return res.status(200).json({ success: true, message: 'User updated successfully' })
      } else {
        return res.status(500).json({ success: false, error: 'Failed to update user' })
      }
    } catch (error) {
      console.error('Error updating user:', error)
      return res.status(500).json({ success: false, error: 'Failed to update user' })
    }
  }

  // DELETE /api/users?id=xxx - Delete user
  if (req.method === 'DELETE') {
    const auth = authenticateAndAuthorize(req, ['admin', 'leader'])
    if (auth.error) {
      return res.status(auth.status).json({ success: false, error: auth.error })
    }

    if (!id) {
      return res.status(400).json({ success: false, error: 'User ID is required' })
    }

    try {
      // Prevent self-deletion
      if (id === auth.user.id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot delete your own account' 
        })
      }

      // Get the user being deleted
      const targetUser = await getUserById(new ObjectId(id))
      if (!targetUser) {
        return res.status(404).json({ success: false, error: 'User not found' })
      }

      // Leaders cannot delete admins or other leaders
      if (auth.user.role === 'leader' && targetUser.role !== 'user') {
        return res.status(403).json({ 
          success: false, 
          error: 'Leaders can only delete regular users' 
        })
      }

      const success = await deleteUser(new ObjectId(id))
      
      if (success) {
        return res.status(200).json({ success: true, message: 'User deleted successfully' })
      } else {
        return res.status(500).json({ success: false, error: 'Failed to delete user' })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      return res.status(500).json({ success: false, error: 'Failed to delete user' })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
