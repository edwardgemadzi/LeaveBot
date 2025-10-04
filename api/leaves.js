// Leave requests endpoint
const leaves = [];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.json({ leaves });
  }

  if (req.method === 'POST') {
    const { employeeName, startDate, endDate, reason } = req.body;
    const newLeave = {
      id: leaves.length + 1,
      employeeName,
      startDate,
      endDate,
      reason: reason || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    leaves.push(newLeave);
    return res.json({ success: true, leave: newLeave });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
