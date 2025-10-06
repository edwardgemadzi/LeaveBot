import clientPromise from '../../lib/mongodb'
import { verifyToken } from '../../lib/auth'

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Verify authentication
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]
  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  const client = await clientPromise
  const db = client.db('leavebot')

  if (req.method === 'GET') {
    // Get balance for a specific user and year
    const { userId, year } = req.query
    
    if (!userId || !year) {
      return res.status(400).json({ error: 'userId and year are required' })
    }

    try {
      const balance = await db.collection('balances').findOne({
        userId,
        year: parseInt(year)
      })

      if (!balance) {
        // Return default balance if none exists
        return res.json({
          success: true,
          balance: {
            userId,
            year: parseInt(year),
            totalDays: 20, // Default 20 days per year
            usedDays: 0,
            pendingDays: 0,
            availableDays: 20
          }
        })
      }

      // Calculate available days
      balance.availableDays = balance.totalDays - balance.usedDays - balance.pendingDays

      return res.json({
        success: true,
        balance
      })
    } catch (error) {
      console.error('Failed to fetch balance:', error)
      return res.status(500).json({ error: 'Failed to fetch balance' })
    }
  }

  if (req.method === 'POST') {
    // Initialize or update balance
    const { userId, year, totalDays, usedDays, pendingDays } = req.body

    // Only admins can modify balances directly
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can modify balances' })
    }

    if (!userId || !year) {
      return res.status(400).json({ error: 'userId and year are required' })
    }

    try {
      const balanceData = {
        userId,
        year: parseInt(year),
        totalDays: totalDays || 20,
        usedDays: usedDays || 0,
        pendingDays: pendingDays || 0,
        updatedAt: new Date()
      }

      await db.collection('balances').updateOne(
        { userId, year: parseInt(year) },
        { $set: balanceData },
        { upsert: true }
      )

      balanceData.availableDays = balanceData.totalDays - balanceData.usedDays - balanceData.pendingDays

      return res.json({
        success: true,
        balance: balanceData
      })
    } catch (error) {
      console.error('Failed to update balance:', error)
      return res.status(500).json({ error: 'Failed to update balance' })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
