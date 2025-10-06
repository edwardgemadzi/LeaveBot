# 🚨 SECURITY BREACH - IMMEDIATE ACTION REQUIRED

## What Happened
Your MongoDB credentials and JWT secret were accidentally exposed in:
- Git commit history (multiple commits)
- GitHub repository (publicly visible)
- Documentation files

## 🔥 CRITICAL - Do These NOW (in order):

### 1. Change MongoDB Password (HIGHEST PRIORITY)
1. Go to: https://cloud.mongodb.com/
2. Log in to your MongoDB Atlas account
3. Click "Database Access" in left sidebar
4. Find user: `leavebot`
5. Click "Edit" → "Edit Password"
6. Generate a new strong password (click "Autogenerate Secure Password")
7. **COPY THE NEW PASSWORD** - you'll need it
8. Click "Update User"

### 2. Update Connection String in .env
```bash
# Open your .env file and update:
MONGODB_URI=mongodb+srv://leavebot:[NEW_PASSWORD_HERE]@leavebot.kih8gyg.mongodb.net/leavebot?retryWrites=true&w=majority&appName=leavebot
```

### 3. Generate New JWT Secret
```bash
# Generate a new random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy the output and update your .env:
JWT_SECRET=[paste the new random string here]
```

### 4. Update Vercel Environment Variables
```bash
# Update MongoDB URI
vercel env rm MONGODB_URI production
vercel env add MONGODB_URI production
# Paste your NEW connection string when prompted

# Update JWT Secret  
vercel env rm JWT_SECRET production
vercel env add JWT_SECRET production
# Paste your NEW JWT secret when prompted

# Redeploy
vercel --prod
```

### 5. Restart Local Dev Server
```bash
# Kill the current dev server (Ctrl+C)
# Start it again to use new credentials
npm run dev
```

### 6. All Users Must Re-Login
After changing JWT_SECRET, all existing sessions will be invalidated.
Everyone needs to log in again with their username/password.

## 📊 What Was Exposed

### Exposed Credentials:
- ❌ MongoDB Username: `leavebot`
- ❌ MongoDB Password: `4AuJfiFNpxw5RuXF` (CHANGE THIS!)
- ❌ MongoDB Cluster: `leavebot.kih8gyg.mongodb.net`
- ❌ JWT Secret: `zymhin-sopraf-2qohDa` (CHANGE THIS!)

### Where It Was Exposed:
- ENV-VARS-FIX.md (now fixed, but in git history)
- Multiple git commits
- GitHub repository (public)

## 🔍 Why This Is Critical

### MongoDB Password Exposure:
- Anyone with this can:
  - ✅ Read all your data (users, teams, leaves)
  - ✅ Modify or delete data
  - ✅ Export your entire database
  - ✅ Lock you out by changing settings

### JWT Secret Exposure:
- Anyone with this can:
  - ✅ Generate fake login tokens
  - ✅ Impersonate any user (including admin)
  - ✅ Access the system without knowing passwords

## ⏱️ Time Sensitivity

**DO THIS WITHIN THE NEXT HOUR:**

| Priority | Action | Time Required |
|----------|--------|---------------|
| 🔥 URGENT | Change MongoDB password | 2 minutes |
| 🔥 URGENT | Update .env file | 1 minute |
| 🔥 URGENT | Generate new JWT secret | 30 seconds |
| 🔥 URGENT | Update Vercel env vars | 3 minutes |
| 🔥 URGENT | Redeploy | 3 minutes |
| **TOTAL** | | **~10 minutes** |

## 📝 Additional Security Steps (After Immediate Fix)

### 1. Check MongoDB Atlas Logs
1. Go to MongoDB Atlas
2. Click "Activity Feed"
3. Look for suspicious login attempts or data access
4. Check "Real-time Performance" for unusual queries

### 2. Check Vercel Deployment Logs
1. Go to Vercel dashboard
2. Check "Functions" logs for unusual API calls
3. Look for unauthorized access patterns

### 3. Rotate All Passwords (Recommended)
Consider asking all users to change their passwords as a precaution.

### 4. Enable MongoDB IP Whitelist
1. Go to MongoDB Atlas → Network Access
2. Restrict access to only:
   - Your local IP
   - Vercel's IP ranges
3. Remove "Allow access from anywhere" if enabled

### 5. Enable 2FA on MongoDB Atlas
1. Go to Account Settings
2. Enable Two-Factor Authentication
3. This prevents unauthorized account access

## 🔒 How to Prevent This in Future

### 1. Never Commit Credentials
```bash
# Always check before committing:
git diff

# If you see credentials, don't commit!
```

### 2. Use Placeholders in Documentation
Instead of:
```
MONGODB_URI=mongodb+srv://user:pass@host/db
```

Write:
```
MONGODB_URI=[Your MongoDB connection string]
```

### 3. Use .env.example
Create a template file:
```bash
# .env.example (safe to commit)
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_here
```

### 4. Double-Check Before Pushing
```bash
# Before pushing, check what you're committing:
git log -1 -p
```

## ✅ Verification Checklist

After completing the urgent steps:

- [ ] MongoDB password changed
- [ ] New password works locally (npm run dev)
- [ ] .env file updated with new credentials
- [ ] New JWT secret generated
- [ ] Vercel env vars updated
- [ ] Vercel redeployed successfully
- [ ] Can log in to production app
- [ ] Users/Teams management works in production
- [ ] No suspicious activity in MongoDB logs

## 🆘 If You Need Help

If you encounter any issues:
1. Check MongoDB Atlas Activity Feed for errors
2. Check Vercel function logs for errors
3. Test locally first (npm run dev)
4. Share error messages (without credentials!)

---

## ⚠️ This is a REAL security issue. Please act immediately.

Once you've changed the credentials, your app will be secure again. The 10 minutes spent now will prevent potential data breaches.
