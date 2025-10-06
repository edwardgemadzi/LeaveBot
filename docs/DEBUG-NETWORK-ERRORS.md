# Debug: Network Errors in User/Team Management

## Issue
Getting "Failed to load data" and network errors when opening:
- Teams Management
- User Management

## Root Cause
The old nested API routes (`/api/users/`, `/api/teams/[id]/`) were deleted, but **Vercel is still serving the old deployment**.

## Solution

### Option 1: Deploy to Vercel (Recommended)
Push code and let Vercel rebuild with new consolidated APIs:

```bash
# Already done - code is pushed to GitHub
# Vercel should auto-deploy from main branch
```

**Check deployment:**
1. Go to https://vercel.com/dashboard
2. Find your LeaveBot project
3. Check if latest deployment includes these files:
   - `/api/users.js` ✅
   - `/api/teams.js` ✅
   - No `/api/users/` folder ❌
   - No `/api/teams/` folder ❌

### Option 2: Manual Vercel Deployment
If auto-deploy is disabled:

```bash
npm install -g vercel
vercel --prod
```

### Option 3: Test Locally (Quick Verification)
Run the dev server to verify APIs work:

```bash
npm run dev
```

Then test:
- http://localhost:5173 (frontend)
- APIs should be proxied through Vite

## Expected Behavior After Deploy

### User Management
- `GET /api/users` → Returns list of users ✅
- `GET /api/users?id=xxx` → Returns specific user ✅
- `POST /api/users` → Create user ✅
- `PUT /api/users?id=xxx` → Update user ✅
- `DELETE /api/users?id=xxx` → Delete user ✅

### Team Management
- `GET /api/teams` → Returns list of teams ✅
- `GET /api/teams?id=xxx` → Returns team with members ✅
- `POST /api/teams` → Create team ✅
- `PUT /api/teams?id=xxx` → Update team ✅
- `DELETE /api/teams?id=xxx` → Delete team ✅
- `POST /api/teams?id=xxx&action=assign` → Assign user ✅
- `POST /api/teams?id=xxx&action=remove` → Remove user ✅

## Verification Steps

1. **Check Network Tab:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try loading Users or Teams
   - Look for 404 errors on old routes
   
2. **Expected Requests:**
   ```
   ✅ GET /api/users → 200 OK
   ✅ GET /api/teams → 200 OK
   ❌ GET /api/users/index → 404 (old route)
   ```

3. **If you see 404s on old routes:**
   - Vercel hasn't deployed new code yet
   - Check Vercel dashboard for deployment status
   - May need to manually trigger deployment

## Temporary Workaround
If deployment is stuck, you can temporarily run locally:

```bash
# Terminal 1: Run Vite dev server
npm run dev

# Terminal 2: Run Vercel dev for serverless functions
vercel dev
```

Then access at http://localhost:3000 (Vercel dev) instead of Vercel production URL.

## Calendar Fix
Removed the filter that only showed approved leaves - now shows **all** leaves (approved, pending, rejected) with color coding:
- 🟢 Green = My approved leaves
- 🔵 Blue = Team approved leaves  
- 🟡 Amber = Pending leaves
- 🔴 Red = Rejected leaves

---

**Status:** Code is pushed, waiting for Vercel deployment to pick up changes.
**Next:** Check Vercel dashboard for deployment status.
