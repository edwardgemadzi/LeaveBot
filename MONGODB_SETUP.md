# 🍃 MongoDB Atlas Setup Guide

## Step-by-Step Setup (Free Tier - 512MB)

### 1. Create MongoDB Atlas Account

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with email or Google account
3. Choose **FREE** shared cluster (M0 Sandbox)

### 2. Create a Cluster

1. Click **"Build a Database"**
2. Select **FREE** tier (M0)
3. Choose cloud provider and region (pick closest to your users):
   - **AWS** - N. Virginia (us-east-1) - Good for US East Coast
   - **GCP** - Iowa (us-central1) - Good for US Central
   - **Azure** - East US (eastus) - Good for US East Coast
4. Name your cluster (or use default: `Cluster0`)
5. Click **"Create Cluster"** (takes 1-3 minutes)

### 3. Create Database User

1. Click **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Authentication Method: **Password**
4. Username: `leavebot-admin` (or your choice)
5. Password: **Click "Autogenerate Secure Password"** and save it!
6. Database User Privileges: **Read and write to any database**
7. Click **"Add User"**

**IMPORTANT:** Save your password! You'll need it for the connection string.

### 4. Allow Network Access

1. Click **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. Choose **"Allow Access from Anywhere"** (0.0.0.0/0)
   - This is safe because you still need username/password
   - Required for Vercel serverless functions (dynamic IPs)
4. Click **"Confirm"**

### 5. Get Connection String

1. Click **"Database"** in left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy the connection string, it looks like:
   ```
   mongodb+srv://leavebot-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Replace `<password>` with your actual password**
7. **Add database name** after `.net/`: 
   ```
   mongodb+srv://leavebot-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/leavebot?retryWrites=true&w=majority
   ```

### 6. Set Environment Variable in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (LeaveBot)
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name:** `MONGODB_URI`
   - **Value:** Your connection string from step 5
   - **Environment:** Production, Preview, Development (select all)
5. Click **"Save"**

6. Also set (if not already set):
   - **Name:** `JWT_SECRET`
   - **Value:** Generate with: `openssl rand -base64 32`
   - **Environment:** All

7. Optional - Add admin user:
   - `ADMIN_USERNAME=yourusername`
   - `ADMIN_PASSWORD=yourpassword` (min 8 chars)
   - `ADMIN_NAME=Your Name`

### 7. Redeploy Your Application

1. Go to **Deployments** tab in Vercel
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**

OR push a new commit:
```bash
git commit --allow-empty -m "Trigger redeploy with MongoDB"
git push
```

### 8. Test Your Application

1. Visit your app: `https://your-app.vercel.app`
2. Click **"Register"**
3. Create your admin account (first user = admin)
4. Try logging out and back in
5. Create a leave request
6. **Sessions should persist now!** 🎉

---

## 📊 Verify MongoDB Connection

### Check Vercel Logs

1. Vercel Dashboard → Your Project → **Deployments**
2. Click on latest deployment
3. Go to **Functions** tab
4. Click on a function (e.g., `api/login.js`)
5. Look for logs:
   ```
   ✅ Connected to MongoDB
   ✅ Initial admin user created from environment variables
   ```

### Check MongoDB Atlas

1. Go to MongoDB Atlas Dashboard
2. Click **"Database"** → Your Cluster
3. Click **"Browse Collections"**
4. You should see:
   - Database: `leavebot`
   - Collections: `users`, `leaves`
5. Click on collections to see your data!

---

## 🔧 Troubleshooting

### Error: "MONGODB_URI not defined"
- **Solution:** Set `MONGODB_URI` in Vercel environment variables
- Redeploy after adding

### Error: "Authentication failed"
- **Solution:** Check your connection string password is correct
- Make sure you replaced `<password>` with actual password
- No special characters should be URL-encoded (e.g., `@` becomes `%40`)

### Error: "Connection timeout"
- **Solution:** Check Network Access in MongoDB Atlas
- Make sure "0.0.0.0/0" is allowed
- Wait a few minutes after adding IP

### Sessions still expire
- **Solution:** Check Vercel logs to confirm MongoDB connection
- Make sure `MONGODB_URI` is set correctly
- Clear browser localStorage and try fresh registration

### Can't see collections in Atlas
- **Solution:** Collections are created on first data insert
- Register a user first, then check Atlas

---

## 💰 MongoDB Atlas Free Tier Limits

- **Storage:** 512 MB
- **RAM:** Shared
- **Connections:** 500 concurrent
- **Backup:** None (paid feature)
- **Perfect for:** Development, small projects, testing

**Your leave management app will use:**
- ~1 KB per user
- ~0.5 KB per leave request
- **Can handle:** ~10,000 users and ~100,000 leave requests on free tier!

---

## 🚀 What's Next?

Now that you have MongoDB:
- ✅ Sessions persist across function restarts
- ✅ Users don't disappear
- ✅ Leave requests are saved permanently
- ✅ Production-ready database

**Recommended upgrades:**
1. Set up automated backups (MongoDB Atlas paid tier)
2. Add indexes for better performance (already done in code)
3. Monitor usage in MongoDB Atlas dashboard
4. Consider M10 cluster ($0.08/hr) for better performance in production

---

## 📚 Additional Resources

- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [MongoDB Node.js Driver Docs](https://www.mongodb.com/docs/drivers/node/current/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Connection String Format](https://www.mongodb.com/docs/manual/reference/connection-string/)

Need help? Check MongoDB Atlas dashboard or Vercel function logs for detailed error messages!
