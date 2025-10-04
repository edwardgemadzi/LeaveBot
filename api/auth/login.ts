// API endpoint: /api/auth/login
// Step 1: Request OTP - generates and sends OTP to Telegram

import { generateOTP, storeOTP, hasRecentOTP } from '../_lib/otp';
import { sendOTPToTelegram } from '../_lib/telegram';
import { getUserByUsername } from '../_lib/users';

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

    // Get user from database
    const user = getUserByUsername(username);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if OTP was recently sent (prevent spam)
    if (hasRecentOTP(username)) {
      return res.status(429).json({ 
        error: 'Please wait before requesting a new code',
        remainingSeconds: 30 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP
    storeOTP(username, user.id, otp);

    // Send OTP via Telegram
    const sent = await sendOTPToTelegram(username, otp);

    if (!sent) {
      return res.status(500).json({ 
        error: 'Could not send verification code. Please make sure you have started a conversation with the LeaveBot on Telegram by sending /start',
        hint: 'Open Telegram and search for LeaveBot, then click Start'
      });
    }

    return res.json({
      success: true,
      message: 'Verification code sent to your Telegram',
      user: {
        id: user.id,
        name: user.name,
        telegram_username: user.telegram_username,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
