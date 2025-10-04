// Telegram Bot Service for sending OTP codes

// IMPORTANT: Bot token should be set in Vercel environment variables
// Go to Vercel Dashboard → Project Settings → Environment Variables
// Add: TELEGRAM_BOT_TOKEN = your_bot_token_here
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('WARNING: TELEGRAM_BOT_TOKEN environment variable is not set!');
}

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

interface TelegramUser {
  id: number;
  username: string;
}

// Cache of username to chat_id mappings
const chatIdCache = new Map<string, number>();

async function getChatIdByUsername(username: string): Promise<number | null> {
  // Check cache first
  if (chatIdCache.has(username)) {
    return chatIdCache.get(username)!;
  }

  try {
    // Try to get updates to find the user's chat_id
    // Note: This only works if the user has interacted with the bot before
    const response = await fetch(`${TELEGRAM_API}/getUpdates?limit=100`);
    const data: any = await response.json();

    if (data.ok && data.result) {
      for (const update of data.result) {
        const message = update.message || update.callback_query?.message;
        if (message?.from?.username?.toLowerCase() === username.toLowerCase()) {
          const chatId = message.chat.id;
          chatIdCache.set(username.toLowerCase(), chatId);
          return chatId;
        }
      }
    }
  } catch (error) {
    console.error('Error getting chat ID:', error);
  }

  return null;
}

export async function sendOTPToTelegram(username: string, otp: string): Promise<boolean> {
  try {
    const chatId = await getChatIdByUsername(username);

    if (!chatId) {
      console.error(`Could not find Telegram chat for username: ${username}`);
      return false;
    }

    const message = `🔐 <b>LeaveBot Login Verification</b>\n\n` +
                   `Your one-time password is: <code>${otp}</code>\n\n` +
                   `⏱ This code expires in 5 minutes.\n` +
                   `🔒 Do not share this code with anyone.`;

    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const result: any = await response.json();
    return result.ok;
  } catch (error) {
    console.error('Error sending OTP to Telegram:', error);
    return false;
  }
}

// Helper function to cache chat_id when user interacts with bot
export function cacheChatId(username: string, chatId: number): void {
  chatIdCache.set(username.toLowerCase(), chatId);
}
