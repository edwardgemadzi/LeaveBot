// Simple login endpoint
const users = [
  { id: 1, username: 'edgemadzi', password: 'admin123', name: 'Edward Gemadzi', role: 'admin' }
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  return res.json({
    success: true,
    user: { id: user.id, username: user.username, name: user.name, role: user.role },
    token: Buffer.from(`${user.id}:${user.username}`).toString('base64')
  });
}
