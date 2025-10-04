// API endpoint: /api/employees

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
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

  return res.status(405).json({ error: 'Method not allowed' });
}
