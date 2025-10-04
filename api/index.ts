// Vercel Serverless Function - API Handler

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.url?.replace('/api', '') || '/';
  
  // Health check
  if (path === '/health' || path === '/') {
    return res.json({ 
      status: 'ok',
      message: 'LeaveBot API - Serverless Mode',
      timestamp: new Date().toISOString()
    });
  }

  // Mock employees endpoint
  if (path === '/employees' && req.method === 'GET') {
    return res.json({
      employees: [
        { 
          id: 1, 
          name: 'Admin User', 
          telegram_username: 'edgemadzi', 
          role: 'admin', 
          shift: 'day', 
          schedule_type: 'mon_fri' 
        }
      ]
    });
  }
  
  // Mock leave requests endpoint
  if (path === '/leave-requests' && req.method === 'GET') {
    return res.json({
      requests: []
    });
  }
  
  // Mock calendar endpoint
  if (path.startsWith('/calendar')) {
    const year = req.query.year || new Date().getFullYear();
    const month = req.query.month || new Date().getMonth() + 1;
    
    return res.json({
      calendar: [],
      year,
      month
    });
  }
  
  // Create leave request
  if (path === '/leave-requests' && req.method === 'POST') {
    return res.status(201).json({
      success: true,
      message: 'Leave request created (mock)',
      request: req.body
    });
  }
  
  // Default 404
  return res.status(404).json({ 
    error: 'Endpoint not found',
    path,
    method: req.method 
  });
}
