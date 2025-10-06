# 🚀 Quick Deploy to Test Registration

## The Issue
Your API endpoints are Vercel serverless functions - they don't run with `npm run dev` locally. You need to test on Vercel.

## Solution: Update Vercel & Test Live

### Step 1: Update Vercel Environment Variables (2 minutes)

Go to: https://vercel.com/dashboard

1. Select your **LeaveBot** project
2. Go to **Settings** → **Environment Variables**
3. Find and **UPDATE** these two variables:

#### MONGODB_URI
```
mongodb+srv://leavebot:<YOUR_PASSWORD>@leavebot.kih8gyg.mongodb.net/leavebot?retryWrites=true&w=majority&appName=leavebot
```
- Click "Edit" on existing MONGODB_URI
- Paste the new value
- Select: ✅ Production ✅ Preview ✅ Development
- Click "Save"

#### JWT_SECRET
```
<YOUR_JWT_SECRET>
```
- Click "Edit" on existing JWT_SECRET
- Paste the new value  
- Select: ✅ Production ✅ Preview ✅ Development
- Click "Save"

### Step 2: Trigger Deployment

After saving environment variables:

**Option A: Redeploy in Vercel Dashboard**
1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**

**Option B: Push a commit**
```bash
git commit --allow-empty -m "Redeploy with rotated credentials"
git push
```

### Step 3: Wait for Deployment (1-2 minutes)

Watch the deployment progress in Vercel Dashboard.

### Step 4: Test Registration on Live Site

Once deployed:
1. Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Click **"Register"**
3. Enter your admin details
4. Click **"Register"**
5. **Success!** You should be logged in automatically

---

## Alternative: Install Vercel CLI for Local Testing

If you prefer to test locally:

```bash
# Install Vercel CLI
npm install -g vercel

# Run local development with serverless functions
vercel dev

# This will start both frontend AND API endpoints locally
```

Then visit: http://localhost:3000 (not 5173)

---

## Recommended: Deploy to Vercel Now

Since your credentials are already rotated and secure, deploying to Vercel is the fastest way to test. Just update those 2 environment variables and redeploy!

**After successful registration on Vercel, the security incident will be 100% resolved! 🎉**
