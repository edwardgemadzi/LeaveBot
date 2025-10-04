// API endpoint: /api/calendar

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    // Generate calendar days for the date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const calendar = [];
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().slice(0, 10);
      const dayOfWeek = date.getDay();
      
      // Skip weekends (0 = Sunday, 6 = Saturday) for day shift workers
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      calendar.push({
        date: dateStr,
        status: 'available',
        requests: [],
        isWorkday: !isWeekend
      });
    }
    
    return res.json({
      calendar,
      startDate,
      endDate
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
