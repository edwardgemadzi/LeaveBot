# 🚨 CRITICAL: Environment Variables Missing on Vercel

## The Problem

Your serverless functions **are deployed** but **failing** because Vercel doesn't have the environment variables!

When I tested the API:
```bash
curl https://leave-9j7ufoj5k-edwardgemadzis-projects.vercel.app/api/users
# Returns: 401 Unauthorized (endpoint exists ✅)
```

But your frontend gets "Failed to load users" because the API can't:
- ❌ Connect to MongoDB (no `MONGODB_URI`)
- ❌ Verify JWT tokens (no `JWT_SECRET`)

## 🎯 IMMEDIATE FIX - Add Environment Variables to Vercel

### Option 1: Vercel Dashboard (Easiest - 2 minutes)

1. **Go to:** https://vercel.com/edwardgemadzis-projects/leave-bot/settings/environment-variables

2. **Add these variables:**

   **Variable 1:**
   - Key: `MONGODB_URI`
   - Value: `[Your MongoDB connection string from .env file]`
   - Environment: **Production** (check the box)

   **Variable 2:**
   - Key: `JWT_SECRET`
   - Value: `[Your JWT secret from .env file]`
   - Environment: **Production** (check the box)

   **Variable 3 (optional for dev):**
   - Key: `VITE_API_URL`
   - Value: (leave empty or set to your domain)
   - Environment: **Production**

3. **Click "Save"** for each variable

4. **Redeploy:**
   - Go back to your project
   - Click "Deployments" tab
   - Click latest deployment
   - Click "..." → "Redeploy"
   - **Check "Use existing Build Cache"** (faster)
   - Click "Redeploy"

5. **Wait 2-3 minutes** for redeploy to complete

### Option 2: Vercel CLI (Fast)

```bash
cd /Users/edward/LeaveBot

# Add MongoDB URI
vercel env add MONGODB_URI production
# When prompted, paste: [Your MongoDB connection string from .env]

# Add JWT Secret
vercel env add JWT_SECRET production
# When prompted, paste: [Your JWT secret from .env]

# Redeploy
vercel --prod
```

## 🔍 Why This Happened

### How Environment Variables Work:

**Local Development (.env file):**
```
.env → Read by Vite → Works locally ✅
```

**Vercel Production:**
```
.env → NOT uploaded to Vercel (in .gitignore) ❌
Vercel → Needs vars configured in dashboard ❌
```

### The Confusion:

When I deployed with `vercel --prod`, it only deployed:
- ✅ Your code files (api/, src/)
- ✅ Your build output
- ❌ NOT your .env file (blocked by .gitignore)

So Vercel has the code but not the configuration!

## ✅ How to Verify It's Fixed

After adding environment variables and redeploying:

### Test 1: Check API with Auth
```bash
# This should return user data (not 401)
# You'll need a valid token though
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://leave-9j7ufoj5k-edwardgemadzis-projects.vercel.app/api/users
```

### Test 2: Check Your App
1. Open: https://leave-9j7ufoj5k-edwardgemadzis-projects.vercel.app
2. Log in as admin
3. Go to **Users Management** → Should load users ✅
4. Go to **Teams Management** → Should load teams ✅

### Test 3: Check Vercel Logs
1. Go to Vercel dashboard
2. Click your project → "Functions" tab
3. Click on `users.js` or `teams.js`
4. Check "Invocations" - should see 200 status codes

## 📊 What Each Variable Does

### MONGODB_URI
```
Purpose: Connect to MongoDB Atlas database
Used by: All API functions (users, teams, leaves, etc.)
Without it: Cannot read/write any data ❌
```

### JWT_SECRET
```
Purpose: Verify authentication tokens
Used by: All protected API endpoints
Without it: Cannot verify logged-in users ❌
```

### VITE_API_URL (optional)
```
Purpose: Override API base URL (usually not needed)
Used by: Frontend API calls
Default: Uses relative paths (/api/users) ✅
```

## 🎯 Expected Timeline

| Step | Time |
|------|------|
| Add env vars in dashboard | 1 min |
| Trigger redeploy | 30 sec |
| Wait for build | 2-3 min |
| Test app | 1 min |
| **Total** | **~5 min** |

## 🔧 Troubleshooting

### If still not working after adding vars:

**1. Check vars are set correctly:**
```bash
vercel env ls
# Should show: MONGODB_URI, JWT_SECRET
```

**2. Check Vercel function logs:**
- Go to Vercel dashboard
- Click project → "Functions"
- Look for error messages like:
  - "Cannot connect to MongoDB"
  - "JWT_SECRET not defined"

**3. Verify MongoDB connection:**
```bash
# Test MongoDB connection string locally
mongosh "[Your MongoDB connection string]"
```

**4. Check if .env is in .gitignore:**
```bash
cat .gitignore | grep .env
# Should show: .env or *.env
```

## 📝 Long-Term Solution

To avoid this in future, add a reminder in your deployment checklist:

**Deployment Checklist:**
- [ ] Code pushed to GitHub
- [ ] Environment variables set in Vercel dashboard
- [ ] Deployment successful
- [ ] Tested in production

Or use Vercel's GitHub integration (auto-deploy on push):
1. Connect your GitHub repo in Vercel dashboard
2. Set env vars once
3. Every push auto-deploys with correct env vars ✅

## 🆘 Alternative: Quick Test Locally

If you want to verify everything works while waiting:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Open browser
open http://localhost:5173

# Test:
# - Login as admin
# - Users Management → Should work ✅
# - Teams Management → Should work ✅
```

If it works locally, it confirms the issue is just missing env vars on Vercel.

---

## 🚀 TL;DR - DO THIS NOW:

1. Go to: https://vercel.com/edwardgemadzis-projects/leave-bot/settings/environment-variables
2. Add `MONGODB_URI` and `JWT_SECRET` (values from your .env)
3. Click "Deployments" → latest → "..." → "Redeploy"
4. Wait 3 minutes
5. Test your app

**This will fix everything.** ✅
