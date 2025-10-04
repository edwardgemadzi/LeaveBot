// API endpoint: /api/telegram/webhook
// Receives messages from Telegram via webhook

import { cacheChatId } from '../lib/telegram';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('WARNING: TELEGRAM_BOT_TOKEN environment variable is not set!');
}

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Helper to send messages
async function sendMessage(chatId: number, text: string, options: any = {}) {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        ...options,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    return { ok: false };
  }
}

// Check if user is registered
async function checkUserRegistration(username: string): Promise<any> {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'https://leave-bot-wine.vercel.app';
    
    const response = await fetch(`${baseUrl}/api/telegram/check-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_username: username }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error checking registration:', error);
    return { registered: false };
  }
}

// Command handlers
async function handleStart(chatId: number, username: string) {
  const result = await checkUserRegistration(username);
  
  if (result.registered) {
    const { user } = result;
    const roleEmoji = user.role === 'admin' ? '👑' : user.role === 'supervisor' ? '👨‍💼' : '👤';
    
    await sendMessage(chatId, 
      `${result.message}\n\n` +
      `${roleEmoji} <b>${user.name}</b>\n` +
      `📋 Role: <b>${user.role}</b>\n\n` +
      `Available commands:\n` +
      `/book - Request leave\n` +
      `/calendar - View calendar\n` +
      `/status - Check leave status\n` +
      `/help - Show all commands`
    );
  } else {
    await sendMessage(chatId,
      `${result.hint}\n\n` +
      `📝 Register at: ${result.web_app_url}`
    );
  }
}

async function handleCalendar(chatId: number, username: string) {
  const result = await checkUserRegistration(username);
  
  if (!result.registered) {
    await sendMessage(chatId,
      `⛔️ <b>Access Denied</b>\n\n` +
      `${result.hint}\n\n` +
      `📝 Register at: ${result.web_app_url}`
    );
    return;
  }

  await sendMessage(chatId,
    `📅 <b>Leave Calendar</b>\n\n` +
    `View the full calendar on the web app:\n` +
    `${result.web_app_url}`
  );
}

async function handleBook(chatId: number, username: string) {
  const result = await checkUserRegistration(username);
  
  if (!result.registered) {
    await sendMessage(chatId,
      `⛔️ <b>Access Denied</b>\n\n` +
      `${result.hint}\n\n` +
      `📝 Register at: ${result.web_app_url}`
    );
    return;
  }

  await sendMessage(chatId,
    `📝 <b>Request Leave</b>\n\n` +
    `To request leave, please use the web app:\n` +
    `${result.web_app_url}\n\n` +
    `The web interface provides a full calendar view where you can:\n` +
    `• Select your dates\n` +
    `• Choose leave type\n` +
    `• Add notes\n` +
    `• Submit for approval`
  );
}

async function handleStatus(chatId: number, username: string) {
  const result = await checkUserRegistration(username);
  
  if (!result.registered) {
    await sendMessage(chatId,
      `⛔️ <b>Access Denied</b>\n\n` +
      `${result.hint}\n\n` +
      `📝 Register at: ${result.web_app_url}`
    );
    return;
  }

  await sendMessage(chatId,
    `📊 <b>Your Leave Status</b>\n\n` +
    `View your leave requests on the web app:\n` +
    `${result.web_app_url}\n\n` +
    `You can see:\n` +
    `✅ Approved requests\n` +
    `⏳ Pending requests\n` +
    `❌ Rejected requests`
  );
}

async function handleHelp(chatId: number, username: string) {
  const result = await checkUserRegistration(username);
  
  const commands = result.registered
    ? `📚 <b>Available Commands</b>\n\n` +
      `<b>General:</b>\n` +
      `/start - Welcome message\n` +
      `/help - Show this help\n\n` +
      `<b>Leave Management:</b>\n` +
      `/book - Request leave\n` +
      `/calendar - View calendar\n` +
      `/status - Check your leave status\n\n` +
      `🌐 <b>Web App:</b>\n` +
      `For full features, use: ${result.web_app_url}`
    : `📚 <b>LeaveBot Help</b>\n\n` +
      `This bot helps you manage leave requests.\n\n` +
      `<b>Get Started:</b>\n` +
      `1. Register at: ${result.web_app_url}\n` +
      `2. Ask your admin to add you\n` +
      `3. Come back and use /start\n\n` +
      `<b>Commands:</b>\n` +
      `/start - Check registration\n` +
      `/help - Show this help`;

  await sendMessage(chatId, commands);
}

export default async function handler(req: any, res: any) {
  // Only accept POST requests from Telegram
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;

    // Handle message
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const username = message.from.username?.toLowerCase();
      const text = message.text;

      // Cache the chat_id for this username (used for OTP delivery)
      if (username) {
        cacheChatId(username, chatId);
      }

      // Handle commands
      if (text?.startsWith('/')) {
        const command = text.split(' ')[0].toLowerCase();

        switch (command) {
          case '/start':
            if (!username) {
              await sendMessage(chatId, 
                `⚠️ <b>Username Required</b>\n\n` +
                `Please set a Telegram username in your profile settings to use this bot.`
              );
              break;
            }
            await handleStart(chatId, username);
            break;

          case '/help':
            await handleHelp(chatId, username || '');
            break;

          case '/calendar':
            if (!username) {
              await sendMessage(chatId, 
                `⚠️ Please set a Telegram username to use this command.`
              );
              break;
            }
            await handleCalendar(chatId, username);
            break;

          case '/book':
            if (!username) {
              await sendMessage(chatId, 
                `⚠️ Please set a Telegram username to use this command.`
              );
              break;
            }
            await handleBook(chatId, username);
            break;

          case '/status':
            if (!username) {
              await sendMessage(chatId, 
                `⚠️ Please set a Telegram username to use this command.`
              );
              break;
            }
            await handleStatus(chatId, username);
            break;

          default:
            await sendMessage(chatId,
              `❓ Unknown command. Try /help to see available commands.`
            );
        }
      }
    }

    // Always respond with 200 to Telegram
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Still return 200 to prevent Telegram from retrying
    return res.status(200).json({ ok: true });
  }
}
