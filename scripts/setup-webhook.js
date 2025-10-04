#!/usr/bin/env node

/**
 * Setup Telegram Webhook
 * 
 * This script registers your Vercel deployment URL with Telegram
 * so the bot receives messages via webhook instead of polling.
 * 
 * Usage:
 *   node scripts/setup-webhook.js
 * 
 * Requirements:
 *   - TELEGRAM_BOT_TOKEN in bot/.env
 *   - Vercel deployment already done
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load bot token from bot/.env
function loadBotToken() {
  const envPath = path.join(__dirname, '../bot/.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ bot/.env file not found!');
    console.log('Create bot/.env with: TELEGRAM_BOT_TOKEN=your_token');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/TELEGRAM_BOT_TOKEN=(.+)/);
  
  if (!match) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in bot/.env');
    process.exit(1);
  }

  return match[1].trim();
}

// Set webhook URL
function setWebhook(botToken, webhookUrl) {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${botToken}/setWebhook`;
    const data = JSON.stringify({ url: webhookUrl });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Get webhook info
function getWebhookInfo(botToken) {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;

    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Delete webhook (switch back to polling)
function deleteWebhook(botToken) {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${botToken}/deleteWebhook`;

    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const botToken = loadBotToken();
  const webhookUrl = 'https://leave-bot-wine.vercel.app/api/telegram/webhook';

  console.log('🤖 Telegram Webhook Setup\n');

  if (command === 'delete') {
    console.log('Removing webhook...');
    const result = await deleteWebhook(botToken);
    if (result.ok) {
      console.log('✅ Webhook deleted successfully');
      console.log('💡 You can now use polling mode (npm run dev in bot/)');
    } else {
      console.error('❌ Failed to delete webhook:', result.description);
    }
    return;
  }

  if (command === 'info') {
    console.log('Getting webhook info...');
    const result = await getWebhookInfo(botToken);
    if (result.ok) {
      console.log('\n📊 Current Webhook Status:');
      console.log('URL:', result.result.url || '(none)');
      console.log('Pending updates:', result.result.pending_update_count);
      if (result.result.last_error_message) {
        console.log('Last error:', result.result.last_error_message);
      }
    }
    return;
  }

  // Set webhook (default)
  console.log('Setting webhook URL...');
  console.log('URL:', webhookUrl);
  console.log('');

  const result = await setWebhook(botToken, webhookUrl);

  if (result.ok) {
    console.log('✅ Webhook set successfully!\n');
    console.log('🎉 Your bot is now live and will receive messages via webhook.');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Make sure TELEGRAM_BOT_TOKEN is set in Vercel environment variables');
    console.log('2. Redeploy your Vercel app if you just added the token');
    console.log('3. Test by sending /start to your bot on Telegram');
    console.log('');
    console.log('💡 Commands:');
    console.log('  node scripts/setup-webhook.js       - Set webhook (default)');
    console.log('  node scripts/setup-webhook.js info  - Check webhook status');
    console.log('  node scripts/setup-webhook.js delete - Remove webhook');
  } else {
    console.error('❌ Failed to set webhook:', result.description);
    console.log('\n💡 Troubleshooting:');
    console.log('- Make sure your Vercel deployment is live');
    console.log('- Verify the webhook URL is accessible');
    console.log('- Check that bot token is correct');
  }
}

main().catch(console.error);
