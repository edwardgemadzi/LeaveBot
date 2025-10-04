# Telegram Bot Webhook Setup Guide

## 🎯 Overview

Your bot now uses **webhooks** instead of polling. This means:
- ✅ No 409 Conflict errors
- ✅ Works perfectly with Vercel serverless
- ✅ Instant message delivery
- ✅ Lower server load

## 📋 Prerequisites Checklist

Before setting up webhooks, ensure:

1. ✅ Bot is deployed on Vercel: https://leave-bot-wine.vercel.app
2. ✅ `TELEGRAM_BOT_TOKEN` is set in Vercel environment variables
3. ✅ Latest code is pushed to GitHub (auto-deploys to Vercel)
4. ✅ Vercel deployment is complete and live

## 🚀 Quick Setup (3 Steps)

### Step 1: Stop Local Bot (if running)

The local bot with polling must be stopped first:

```bash
# Kill any running bot processes
pkill -9 -f "tsx watch"
```

### Step 2: Set Bot Token in Vercel

**CRITICAL:** The webhook won't work without this!

1. Go to https://vercel.com/dashboard
2. Open your **LeaveBot** project
3. Go to **Settings** → **Environment Variables**
4. Add variable:
   - Name: `TELEGRAM_BOT_TOKEN`
   - Value: `[your bot token from bot/.env]`
   - Environments: ✅ Production, ✅ Preview, ✅ Development
5. Click **Save**
6. Go to **Deployments** → Click **...** on latest → **Redeploy**

### Step 3: Register Webhook URL

Run the setup script:

```bash
node scripts/setup-webhook.js
```

You should see:
```
✅ Webhook set successfully!
🎉 Your bot is now live and will receive messages via webhook.
```

## ✅ Verify It's Working

### Test 1: Check Webhook Status
```bash
node scripts/setup-webhook.js info
```

Should show:
```
📊 Current Webhook Status:
URL: https://leave-bot-wine.vercel.app/api/telegram/webhook
Pending updates: 0
```

### Test 2: Test on Telegram

1. Open Telegram
2. Search for your bot
3. Send `/start`
4. You should get an instant response!

### Test 3: Test Login OTP

1. Visit https://leave-bot-wine.vercel.app
2. Enter username: `edgemadzi`
3. Click "Send Verification Code"
4. Check Telegram for OTP message
5. Enter OTP to complete login

## 🔧 Troubleshooting

### "Failed to set webhook"

**Cause:** Vercel deployment not ready or URL incorrect

**Fix:**
1. Verify deployment is live: https://leave-bot-wine.vercel.app
2. Check that URL loads without error
3. Try again after 1 minute

### "500 Internal Server Error" on login

**Cause:** `TELEGRAM_BOT_TOKEN` not set in Vercel

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Add `TELEGRAM_BOT_TOKEN`
3. Redeploy the app
4. Try login again

### Bot not responding on Telegram

**Cause:** Webhook not registered or old polling still active

**Fix:**
```bash
# Check webhook status
node scripts/setup-webhook.js info

# Re-register webhook
node scripts/setup-webhook.js

# If still not working, check Vercel logs:
# Go to Vercel Dashboard → Deployments → View Function Logs
```

### "Chat ID not found" error

**Cause:** User hasn't started conversation with bot

**Fix:**
1. Open Telegram
2. Search for your bot
3. Click **Start** button
4. Try logging in again

## 🔄 Switching Between Webhook and Polling

### Use Webhook (Production - Recommended)
```bash
node scripts/setup-webhook.js
```

### Use Polling (Local Development)
```bash
# Remove webhook
node scripts/setup-webhook.js delete

# Start local bot
cd bot
npm run dev
```

**Note:** You can only use one at a time! Webhook for production, polling for local testing.

## 📊 Architecture

### Old Setup (Polling)
```
Bot (Local) ──┐
              ├──> Telegram API (polling every 1s)
Bot (Vercel) ─┘   ❌ Conflict! Only one can poll
```

### New Setup (Webhook)
```
Telegram ──> Your Vercel URL ──> /api/telegram/webhook
                                  ├─> Handle commands
                                  ├─> Check registration
                                  └─> Send responses
```

## 🎉 Benefits

| Feature | Polling | Webhook |
|---------|---------|---------|
| Works on Vercel | ❌ | ✅ |
| Multiple instances | ❌ | ✅ |
| Real-time responses | ⏱️ 1s delay | ⚡ Instant |
| Server load | High | Low |
| Setup complexity | Easy | Medium |

## 📝 Files Created

- `/api/telegram/webhook.ts` - Webhook endpoint (handles messages)
- `/scripts/setup-webhook.js` - Setup script
- `WEBHOOK_GUIDE.md` - This guide
- `VERCEL_SETUP.md` - Vercel environment variables guide

## 🔐 Security

✅ Webhook endpoint validates requests from Telegram
✅ Bot token stored securely in Vercel environment variables
✅ HTTPS required (Telegram validates SSL certificate)
✅ No tokens in code or git repository

## 🆘 Still Having Issues?

1. Check Vercel deployment logs:
   - Dashboard → Your Project → Deployments → View Function Logs

2. Verify webhook is registered:
   ```bash
   node scripts/setup-webhook.js info
   ```

3. Test webhook endpoint directly:
   ```bash
   curl https://leave-bot-wine.vercel.app/api/telegram/webhook
   ```

4. Check bot token is correct:
   - Compare `bot/.env` with Vercel environment variable

## ✨ Next Steps

Now that webhooks are set up:

1. ✅ Test all bot commands (/start, /calendar, /book, /status, /help)
2. ✅ Test web app login with OTP
3. ✅ Register new users and test their access
4. ✅ Monitor Vercel logs for any errors

Your bot is now production-ready! 🚀
