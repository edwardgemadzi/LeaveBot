# 🚀 Post-Deployment Setup Guide

## ⚠️ CRITICAL: Set Environment Variable in Vercel

Your bot token has been removed from the code for security. You **MUST** add it to Vercel environment variables before the OTP feature will work.

### Step-by-Step:

1. **Go to Vercel Dashboard**
   ```
   https://vercel.com/dashboard
   ```

2. **Select LeaveBot Project**
   - Click on your LeaveBot project

3. **Open Settings**
   - Click "Settings" tab at the top
   - Click "Environment Variables" in the left sidebar

4. **Add TELEGRAM_BOT_TOKEN**
   - Click "Add New" button
   - **Name**: `TELEGRAM_BOT_TOKEN`
   - **Value**: `8277269900:AAEPvAuRszD7fnRxfoUPlYla-ZXAtI4FUQI`
   - **Environments**: Check all three boxes (Production, Preview, Development)
   - Click "Save"

5. **Redeploy**
   - Go to "Deployments" tab
   - Find the latest deployment
   - Click the three dots "..." menu
   - Select "Redeploy"
   - Wait ~2 minutes for deployment to complete

## 🎯 Testing the New Features

### Test 2FA Login:

1. Visit https://leave-bot-wine.vercel.app
2. Enter username: `edgemadzi`
3. Click "Send Verification Code"
4. Check your Telegram for OTP message
5. Enter the 6-digit code
6. Click "Verify & Login"

**Note**: If OTP doesn't arrive:
- Make sure you've sent `/start` to the LeaveBot on Telegram
- Wait 30 seconds and click "Resend Code"

### Test User Registration:

1. After logging in as admin, click "+ Register User"
2. Fill in the form:
   - Name: `Test User`
   - Telegram Username: `testuser`
   - Role: `Team Member`
3. Click "Register User"
4. Logout and try logging in as `testuser`
5. Verify they have limited access (no approval features)

## 📋 What Changed

### Security:
✅ Bot token moved to environment variables
✅ Removed all hardcoded tokens from code
✅ Added `.env.example` for documentation
✅ Created SECURITY.md with best practices

### Authentication:
✅ Two-factor authentication via Telegram OTP
✅ 6-digit codes with 5-minute expiry
✅ Rate limiting to prevent spam
✅ Beautiful OTP input UI

### User Management:
✅ Centralized user system (api/_lib/users.ts)
✅ Registration page for admins/supervisors
✅ Role-based registration permissions
✅ Default admin account: `edgemadzi`

### UI Updates:
✅ Two-step login flow (username → OTP)
✅ Register User button in header
✅ Role badges (Admin/Supervisor)
✅ Success/error messages with hints

## 🔐 Security Checklist

Before using in production:

- [ ] Set `TELEGRAM_BOT_TOKEN` in Vercel environment variables
- [ ] Test 2FA login works
- [ ] Test user registration works
- [ ] Verify role permissions (admin vs team member)
- [ ] Delete test users after testing
- [ ] Change bot token if it was ever committed to public repo
- [ ] Review SECURITY.md for production recommendations

## 🆘 Troubleshooting

### OTP not arriving:
1. Open Telegram and search for your bot
2. Send `/start` command
3. Try logging in again
4. Check Vercel logs for errors

### "User not found" error:
- Only `edgemadzi` exists by default
- Use admin account to register new users first

### Registration not working:
- Make sure you're logged in as admin or supervisor
- Check that TELEGRAM_BOT_TOKEN is set in Vercel
- Check browser console for API errors

### Token validation errors:
- Logout and login again to get fresh token
- Clear browser localStorage if issues persist

## 📊 Current System State

**Users:**
- 1 admin: `edgemadzi` (you)

**Features:**
- ✅ Telegram 2FA login
- ✅ User registration
- ✅ Role-based access
- ✅ Calendar view
- ✅ Leave requests
- ✅ Pending approvals

**What's Next:**
1. Register your team members
2. Test the full workflow
3. Consider adding more features from AUTHENTICATION.md

## 🎉 You're Ready!

Once you've set the environment variable and redeployed:
1. Share the URL with your team: https://leave-bot-wine.vercel.app
2. Register them using the admin account
3. They can login with 2FA using their Telegram username

For detailed security information, see **SECURITY.md**.
For role permissions and features, see **AUTHENTICATION.md**.
