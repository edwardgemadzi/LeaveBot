// API endpoint: /api/telegram/check-user
// Check if a Telegram user is registered in the system

import { getUserByUsername, createUser } from '../_lib/users';
import { cacheChatId } from '../_lib/telegram';

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { telegram_username, chat_id, first_name, last_name } = req.body;

    if (!telegram_username) {
      return res.status(400).json({ 
        error: 'Telegram username is required' 
      });
    }

    const username = telegram_username.toLowerCase().trim();

    // Check if user exists
    const user = getUserByUsername(username);

    // Cache the chat_id for OTP delivery
    if (chat_id) {
      cacheChatId(username, chat_id);
    }

    if (!user) {
      // User not registered
      return res.status(404).json({
        registered: false,
        message: 'You are not registered in the system yet.',
        hint: 'Please ask your administrator to register you via the web app, or visit the web app to register if you have admin privileges.',
        web_app_url: 'https://leave-bot-wine.vercel.app',
      });
    }

    // User exists - return their info
    return res.json({
      registered: true,
      user: {
        id: user.id,
        name: user.name,
        telegram_username: user.telegram_username,
        role: user.role,
        supervisor_id: user.supervisor_id,
      },
      message: `Welcome back, ${user.name}!`,
    });
  } catch (error) {
    console.error('Check user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
