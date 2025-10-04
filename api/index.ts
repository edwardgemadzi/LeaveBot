// Vercel Serverless Function - Mock API
// Returns sample data until full server logic is implemented

export default async function handler(req: any, res: any) {
  const { url, method } = req;
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse path
  const path = url.replace('/api', '');
  
  // Mock responses
  if (path === '/employees' && method === 'GET') {
    return res.json({
      employees: [
        { id: 1, name: 'Admin User', telegram_username: 'admin', role: 'admin', shift: 'day', schedule_type: 'mon_fri' }
      ]
    });
  }
  
  if (path === '/leave-requests' && method === 'GET') {
    return res.json({
      requests: []
    });
  }
  
  if (path.startsWith('/calendar')) {
    return res.json({
      calendar: []
    });
  }
  
  // Default response
  res.json({ 
    message: 'LeaveBot API - Mock Mode',
    note: 'Full API implementation needed',
    path,
    method 
  });
}
