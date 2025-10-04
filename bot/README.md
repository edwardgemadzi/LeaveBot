# 🤖 LeaveBot Telegram Bot

## Overview

This is the Telegram bot component of LeaveBot. It runs **separately** from the main Vercel deployment and provides a conversational interface for managing leave requests.

## 📋 Features

### For All Users:
- `/start` - Register and check your role
- `/help` - Show available commands
- `/book <dates> [reason]` - Book leave (e.g., `/book 2025-10-10 to 2025-10-15 vacation`)
- `/book --emergency <dates>` - Book emergency leave (bypasses 14-day rule)
- `/status` - View your leave requests

### For Supervisors:
- `/team` - View your team members
- `/addmember @username` - Add a team member
- `/setschedule @username <type> [start]` - Set member's work schedule
  - Types: `mon_fri`, `2_2`, `3_3`, `4_4`, `custom`
- `/makesupervisor @username` - Promote to supervisor

### For Admins:
- `/approve <id>` - Approve leave requests
- All supervisor commands
- Full system access

## 🚀 Setup

### 1. Install Dependencies

```bash
cd bot
npm install
```

### 2. Configure Environment

Create or update `.env` file:

```properties
# Get your token from @BotFather on Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather

# API URL - Point to your deployed API
API_BASE_URL=http://localhost:5001/api

# Admin Telegram username (without @)
ADMIN_USERNAME=edgemadzi
```

### 3. Update API URL for Production

After deploying to Vercel, update the API URL:

```properties
API_BASE_URL=https://your-app.vercel.app/api
```

## 💻 Development

### Run in Development Mode (with auto-reload)

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Run Production Build

```bash
npm start
```

## 📁 Structure

```
bot/
├── src/
│   ├── index.ts      # Bot initialization and command routing
│   └── commands.ts   # Command handlers and logic
├── dist/             # Compiled JavaScript (gitignored)
├── .env              # Environment variables (gitignored)
├── package.json      # Dependencies and scripts
└── tsconfig.json     # TypeScript configuration
```

## 🔧 Configuration

### tsconfig.json
- Target: ES2022
- Module: ESNext  
- Outputs to: `dist/`

### Dependencies
- `node-telegram-bot-api` - Telegram Bot API
- `dotenv` - Environment variable management
- `node-fetch` - HTTP requests to API

## ⚠️ Important Notes

1. **Separate Service**: The bot does NOT deploy to Vercel - it runs as a separate process
2. **Always Running**: The bot needs to be running to respond to Telegram messages
3. **API Dependency**: Bot requires the LeaveBot API to be accessible
4. **Username Required**: Users must have a Telegram username to use the bot

## 🌐 Deployment Options

### Option 1: Local Development
Run on your computer:
```bash
npm run dev
```

### Option 2: VPS/Cloud Server
Deploy to:
- DigitalOcean Droplet
- AWS EC2
- Google Cloud Compute
- Any VPS with Node.js

### Option 3: Container Platform
- Railway.app
- Render.com
- Fly.io
- Heroku

### Example: Deploy to Railway

1. Push bot folder to GitHub
2. Create Railway project
3. Connect GitHub repo
4. Set environment variables in Railway dashboard
5. Deploy!

## 🧪 Testing

The bot is tested and working:
- ✅ TypeScript compiles without errors
- ✅ All dependencies installed
- ✅ Commands properly routed
- ✅ API integration configured

## 📝 Usage Examples

### Book Leave
```
/book 2025-10-10 to 2025-10-15 Annual vacation
```

### Emergency Leave
```
/book --emergency 2025-10-08 to 2025-10-09 Family emergency
```

### Check Status
```
/status
```

### Supervisor: Add Team Member
```
/addmember @john_doe
```

### Supervisor: Set Schedule
```
/setschedule @john_doe mon_fri
/setschedule @jane_doe 2_2 2025-10-01
```

## 🔒 Security

- `.env` file is gitignored (contains sensitive tokens)
- Admin commands require ADMIN_USERNAME match
- Supervisor commands check user role
- API authentication handled by backend

## 🐛 Troubleshooting

### Bot doesn't respond
- Check if bot process is running
- Verify TELEGRAM_BOT_TOKEN is correct
- Check Telegram bot settings with @BotFather

### API errors
- Verify API_BASE_URL is correct
- Ensure backend server is running
- Check API endpoint availability

### Permission errors
- Verify ADMIN_USERNAME matches your Telegram username
- Check user roles in database

---

**Status:** ✅ Tested and working
**Last Updated:** October 4, 2025
