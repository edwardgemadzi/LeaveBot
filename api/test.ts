export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    method: req.method 
  });
}
