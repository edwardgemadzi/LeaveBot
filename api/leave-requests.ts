// API endpoint: /api/leave-requests

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.json({
      requests: []
    });
  }

  if (req.method === 'POST') {
    return res.status(201).json({
      success: true,
      message: 'Leave request created (mock)',
      request: req.body
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
