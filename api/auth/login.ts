// API endpoint: /api/auth/login
// Validates Telegram username and returns user info

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { telegram_username } = req.body;

    if (!telegram_username) {
      return res.status(400).json({ error: 'Telegram username is required' });
    }

    const username = telegram_username.toLowerCase().trim();

    // Predefined users - in production, this would query your database
    const users = [
      {
        id: 1,
        name: 'Edward Gemadzi',
        telegram_username: 'edgemadzi',
        role: 'admin',
      },
      {
        id: 2,
        name: 'Team Member 1',
        telegram_username: 'teammember1',
        role: 'team_member',
      },
      {
        id: 3,
        name: 'Team Member 2',
        telegram_username: 'teammember2',
        role: 'team_member',
      },
    ];

    const user = users.find(u => u.telegram_username === username);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate a simple token (in production, use proper JWT)
    const token = Buffer.from(`${user.telegram_username}:${Date.now()}`).toString('base64');

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        telegram_username: user.telegram_username,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
