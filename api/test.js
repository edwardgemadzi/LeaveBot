export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Test if we can access environment variables
  const hasMongoUri = !!process.env.MONGODB_URI
  const hasJwtSecret = !!process.env.JWT_SECRET
  
  return res.status(200).json({
    success: true,
    message: 'API is working!',
    env: {
      hasMongoUri,
      hasJwtSecret,
      nodeVersion: process.version
    },
    timestamp: new Date().toISOString()
  })
}
