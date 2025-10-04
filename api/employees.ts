// API endpoint: /api/employees

function validateAuth(req: any): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  // In production, validate JWT token here
  return true;
}

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check authentication
  if (!validateAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    return res.json({
      employees: [
        { 
          id: 1, 
          name: 'Edward Gemadzi', 
          telegram_username: 'edgemadzi', 
          role: 'admin', 
          shift: 'day', 
          schedule_type: 'mon_fri' 
        },
        { 
          id: 2, 
          name: 'Team Member 1', 
          telegram_username: 'teammember1', 
          role: 'team_member', 
          shift: 'day', 
          schedule_type: 'mon_fri' 
        },
        { 
          id: 3, 
          name: 'Team Member 2', 
          telegram_username: 'teammember2', 
          role: 'team_member', 
          shift: 'day', 
          schedule_type: 'mon_fri' 
        }
      ]
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
