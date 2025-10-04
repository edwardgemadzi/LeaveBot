# LeaveBot - Vercel Deployment Ready ✅

## 🎯 Project Structure

```
LeaveBot/
├── src/                    # React frontend source (Vite + TypeScript)
│   ├── components/         # Calendar, LeaveRequestForm, PendingRequests
│   ├── api.ts             # API client
│   ├── types.ts           # TypeScript interfaces
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── api/                    # Vercel Serverless Functions
│   └── index.ts           # API endpoint (placeholder - needs full server logic)
├── bot/                    # Telegram Bot (runs separately, not on Vercel)
│   ├── src/
│   │   ├── index.ts       # Bot entry point
│   │   └── commands.ts    # Bot commands
│   └── .env               # Bot configuration
├── _backup/                # Backup of original server/client/bot structure
├── dist/                   # Build output (gitignored)
├── index.html             # HTML template
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies and scripts
└── vercel.json            # Vercel configuration (minimal)
```

## 🚀 Local Development

### Frontend Only (Current Setup)
```bash
npm install
npm run dev
# Opens on http://localhost:5173
```

### With Full API (TODO - Needs Implementation)
The API directory currently has a placeholder. To restore full functionality:
1. Copy server logic from `_backup/server/src` to `api/`
2. Adapt for Vercel serverless functions
3. Update package.json with server dependencies

## 📦 Building for Production

```bash
npm run build
```

Output goes to `dist/` directory.

## 🌐 Deploying to Vercel

### Simple Method (Frontend Only)
1. Push to GitHub
2. Import project in Vercel
3. Vercel auto-detects Vite
4. Deploy!

### With API (After Implementation)
Vercel will automatically:
- Serve static files from `dist/`
- Route `/api/*` to serverless functions in `api/` directory

### Environment Variables (To Add in Vercel)
```
TELEGRAM_BOT_TOKEN=your_token_here
ADMIN_USERNAME=your_username
```

## ✅ What's Been Tested

### ✓ Frontend Build
```bash
npm run build
# ✅ Successfully builds React app to dist/
# ✅ Output: dist/index.html + dist/assets/
```

### ✓ Frontend Dev Server
```bash
npm run dev
# ✅ Vite server runs on localhost:5173
# ⚠️  API proxy errors (expected - no backend running)
```

### ⏳ What Still Needs Work

1. **API Implementation**
   - Current: Placeholder returning { message: 'Coming Soon' }
   - Needed: Full Express server logic adapted for serverless
   - Files to restore: routes/api.ts, store/leaveStore.ts, middleware/*, utils/*

2. **Database**
   - Current: Uses sql.js (in-memory SQLite)
   - For Production: Need persistent database (Vercel Postgres, Supabase, etc.)

3. **Bot Deployment**
   - Bot stays in `/bot` directory
   - Runs separately (not on Vercel)
   - Can run locally or on VPS/Railway/etc.

## 🤖 Telegram Bot

The bot is separate and doesn't deploy to Vercel:

```bash
cd bot
npm install
npm run dev
```

Update `bot/.env` with your production API URL after Vercel deployment.

## 📝 Deployment Checklist

- [x] Clean project structure (root-level Vite app)
- [x] Build works (`npm run build`)
- [x] Dev server runs (`npm run dev`)
- [x] Minimal vercel.json (auto-detection)
- [ ] Implement full API in `/api` directory
- [ ] Set up persistent database
- [ ] Test API endpoints locally
- [ ] Deploy to Vercel
- [ ] Update bot with production API URL

## 🎉 Ready to Deploy!

The **frontend** is ready to deploy to Vercel right now:
1. Push to GitHub
2. Import in Vercel
3. Deploy

The calendar UI will work, but API calls will fail until the backend is implemented.

---

**Note**: This is a restructured version optimized for Vercel. Original monorepo structure is backed up in `_backup/` directory.
