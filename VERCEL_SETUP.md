# Vercel Environment Variables Setup

## ⚠️ CRITICAL: Bot Token Required

Your web app is deployed but the login API is failing with 500 error because `TELEGRAM_BOT_TOKEN` is not set in Vercel.

## Quick Fix (5 minutes)

### Step 1: Get Your Bot Token
1. Open your `bot/.env` file
2. Copy the value of `TELEGRAM_BOT_TOKEN`
   - It looks like: `8277269900:AAEPvAuRszD7fnRxfoUPlYla-ZXAtI4FUQI`

### Step 2: Add to Vercel
1. Go to https://vercel.com/dashboard
2. Click on your **LeaveBot** project
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)
5. Click **Add New**
6. Fill in:
   - **Name**: `TELEGRAM_BOT_TOKEN`
   - **Value**: [paste your bot token]
   - **Environments**: Check all three boxes (Production, Preview, Development)
7. Click **Save**

### Step 3: Redeploy
After adding the environment variable, you need to redeploy:
- Go to **Deployments** tab
- Click the three dots (**...**) on the latest deployment
- Click **Redeploy**
- Or just push a new commit to GitHub (auto-deploys)

## Why This Is Needed

The login flow works like this:
1. User enters username on web app
2. Web app calls `/api/auth/login`
3. API generates OTP and sends it via Telegram bot
4. **This step fails without the bot token!**
5. User enters OTP to complete login

Without `TELEGRAM_BOT_TOKEN`, the API cannot send messages to Telegram, causing the 500 error.

## Verification

After setting the environment variable and redeploying:
1. Visit https://leave-bot-wine.vercel.app
2. Enter username: `edgemadzi`
3. Click "Send Verification Code"
4. You should receive OTP on Telegram (no 500 error)

## Security Note

✅ Environment variables in Vercel are secure and encrypted
✅ Never commit bot tokens to git (already in .gitignore)
✅ Only you can see these values in Vercel dashboard
