# 🚀 Deploying LeaveBot to Vercel

This guide will help you deploy your LeaveBot application to Vercel, making it accessible online.

## 📋 Prerequisites

1. A [Vercel account](https://vercel.com/signup) (free tier works great!)
2. [Vercel CLI](https://vercel.com/docs/cli) installed (optional but recommended)
3. Your project pushed to GitHub (recommended) or GitLab/Bitbucket

## 🔧 Setup Steps

### 1. Prepare Your Repository

Make sure your code is in a Git repository:

```bash
cd /Users/edward/LeaveBot
git init
git add .
git commit -m "Initial commit: LeaveBot with calendar and Telegram integration"
```

### 2. Push to GitHub

Create a new repository on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/LeaveBot.git
git branch -M main
git push -u origin main
```

### 3. Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** `cd client && npm install && npm run build`
   - **Output Directory:** `client/dist`
   - **Install Command:** `npm install --legacy-peer-deps`

5. Add Environment Variables:
   - Click "Environment Variables"
   - Add these variables:
   
   ```
   TELEGRAM_BOT_TOKEN=8277269900:AAEPvAuRszD7fnRxfoUPlYla-ZXAtI4FUQI
   ADMIN_USERNAME=edgemadzi
   NODE_ENV=production
   ```

6. Click "Deploy"

#### Option B: Via Vercel CLI

```bash
npm install -g vercel

# From project root
vercel login
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? leavebot (or your choice)
# - Directory? ./ (default)
# - Build settings? No (we have vercel.json)
```

Then set environment variables:

```bash
vercel env add TELEGRAM_BOT_TOKEN
# Paste: 8277269900:AAEPvAuRszD7fnRxfoUPlYla-ZXAtI4FUQI

vercel env add ADMIN_USERNAME
# Paste: edgemadzi

vercel env add NODE_ENV
# Paste: production
```

### 4. Update Telegram Bot Webhook (Optional)

If you want to use webhooks instead of polling:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-app.vercel.app/api/telegram/webhook"
```

## 🌐 Accessing Your Deployed App

After deployment, you'll get a URL like: `https://leavebot-xyz123.vercel.app`

### Features Available Online:

1. **Calendar View** - Anyone can view the leave calendar
2. **Book Leave** - Users can book leave through the web interface
3. **Admin Dashboard** - Approve/reject requests
4. **Telegram Bot** - Continues to work alongside the web app

## ⚙️ Post-Deployment Configuration

### 1. Update Bot Environment Variable

Update your bot's API URL in the Vercel dashboard:

1. Go to your project in Vercel
2. Settings → Environment Variables
3. Add:
   ```
   API_BASE_URL=https://your-app.vercel.app/api
   ```

### 2. Database Persistence

**Important:** Vercel serverless functions are stateless. The SQLite database will reset on each deployment!

**Solutions:**

**Option A: Use Vercel Postgres (Recommended for Production)**

1. Install Vercel Postgres from the marketplace
2. Update `server/src/store/leaveStore.ts` to use PostgreSQL instead of SQLite

**Option B: Use External Database**

1. Set up a PostgreSQL database on:
   - [Supabase](https://supabase.com) (Free tier available)
   - [Railway](https://railway.app)
   - [Neon](https://neon.tech)

2. Add database URL to Vercel environment variables:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   ```

**Option C: Keep SQLite with Persistent Storage (Not Recommended)**

Use Vercel Blob or another storage service to save the SQLite file.

### 3. CORS Configuration

If you need to allow specific domains, update `server/src/index.ts`:

```typescript
app.use(cors({
  origin: ['https://your-app.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
```

## 🔒 Security Considerations

### 1. Add Authentication

For production, add user authentication:

```typescript
// Install passport or next-auth
npm install passport passport-local express-session
```

### 2. Environment Variables

Never commit sensitive data! Always use Vercel environment variables for:
- Database credentials
- API keys
- Bot tokens
- Secret keys

### 3. Rate Limiting

Add rate limiting to prevent abuse:

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 📊 Monitoring

### View Logs

```bash
vercel logs
```

### Check Deployment Status

```bash
vercel inspect
```

### View Analytics

Go to your Vercel dashboard → Analytics

## 🐛 Troubleshooting

### Issue: "Module not found"

**Solution:** Make sure all dependencies are in `package.json`:

```bash
cd client && npm install
cd ../server && npm install
```

### Issue: "API returns 404"

**Solution:** Check `vercel.json` routing:

```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/src/vercel.ts"
    }
  ]
}
```

### Issue: "Database resets on each deployment"

**Solution:** Implement persistent storage (see "Database Persistence" above)

### Issue: "CORS errors"

**Solution:** Update CORS configuration to allow your Vercel domain

```typescript
app.use(cors({
  origin: process.env.VERCEL_URL || 'http://localhost:5173'
}));
```

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to your main branch!

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel will:
1. Detect the push
2. Build your project
3. Deploy automatically
4. Provide a unique preview URL for each branch

## 📱 Custom Domain

### Add Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `leave.yourcompany.com`)
3. Follow DNS configuration instructions
4. Vercel provides free SSL certificates!

## 🎯 Production Checklist

Before going live:

- [ ] Database persistence configured
- [ ] Environment variables set in Vercel
- [ ] CORS configured for your domain
- [ ] Rate limiting enabled
- [ ] Authentication implemented (if needed)
- [ ] Error tracking set up (e.g., Sentry)
- [ ] Backup strategy in place
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Monitoring and alerts configured

## 💡 Performance Tips

1. **Enable Caching:**
   ```typescript
   res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
   ```

2. **Optimize Images:**
   Use Vercel's image optimization

3. **Use Edge Functions:**
   For frequently accessed data

4. **Enable Compression:**
   ```typescript
   import compression from 'compression';
   app.use(compression());
   ```

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Express on Vercel](https://vercel.com/guides/using-express-with-vercel)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## 🆘 Need Help?

- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Community Discord: [vercel.com/discord](https://vercel.com/discord)
- Documentation: [vercel.com/docs](https://vercel.com/docs)

---

**Your App URL (after deployment):**
`https://your-project-name.vercel.app`

**Admin Access:**
- Web: `https://your-project-name.vercel.app`
- Telegram: @YourBotUsername

Enjoy your deployed LeaveBot! 🎉
