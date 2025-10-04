// API endpoint: /api/auth/verify
// Step 2: Verify OTP and return authentication token

import { verifyOTP } from '../_lib/otp';
import { getUserById } from '../_lib/users';

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
    const { telegram_username, otp } = req.body;

    if (!telegram_username || !otp) {
      return res.status(400).json({ error: 'Username and OTP are required' });
    }

    const username = telegram_username.toLowerCase().trim();
    const otpCode = otp.trim();

    // Verify OTP
    const result = verifyOTP(username, otpCode);

    if (!result.valid || !result.userId) {
      return res.status(401).json({ 
        error: 'Invalid or expired verification code',
        hint: 'Please request a new code'
      });
    }

    // Get user details
    const user = getUserById(result.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate authentication token (in production, use proper JWT)
    const token = Buffer.from(`${user.telegram_username}:${Date.now()}:verified`).toString('base64');

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
    console.error('Verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
