# 🔐 Security & Environment Setup

## Critical: Securing Your Bot Token

### ⚠️ NEVER commit bot tokens to Git!

Your Telegram bot token is currently stored locally in `/bot/.env` (which is gitignored).

### Setting Up Environment Variables in Vercel

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Select your LeaveBot project

2. **Navigate to Settings**
   - Click on "Settings" tab
   - Select "Environment Variables" from sidebar

3. **Add TELEGRAM_BOT_TOKEN**
   - Variable name: `TELEGRAM_BOT_TOKEN`
   - Value: Your bot token from @BotFather (format: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)
   - Environment: Select "Production", "Preview", and "Development"
   - Click "Save"

4. **Redeploy**
   - Go to "Deployments" tab
   - Click "..." on latest deployment
   - Select "Redeploy" to apply the new environment variable

### Local Development

Create a `.env.local` file in the root directory (already gitignored):

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

## User Management & Registration

### Default Admin Account

The system comes with one default admin account:
- **Username**: `edgemadzi`
- **Role**: Admin
- **Access**: Full system control

### Registering New Users

#### As Admin:
1. Login to https://leave-bot-wine.vercel.app
2. Click "+ Register User" button in header
3. Fill in the form:
   - Full Name
   - Telegram Username (without @)
   - Role (Admin, Supervisor, or Team Member)
4. Click "Register User"

#### As Supervisor:
- Can only register Team Members
- New team members automatically assigned to the supervisor

### Role Permissions

**Admin:**
- ✅ Register admins, supervisors, and team members
- ✅ Approve any leave request
- ✅ View all teams and calendars
- ✅ Full system access

**Supervisor:**
- ✅ Register team members for their team
- ✅ Approve leave for their team members
- ✅ View their team's calendar
- ❌ Cannot create other supervisors or admins

**Team Member:**
- ✅ Submit leave requests
- ✅ View team calendar
- ✅ View own leave history
- ❌ Cannot approve requests
- ❌ Cannot register other users

## Two-Factor Authentication (2FA)

### How It Works

1. **User enters Telegram username** → System validates user exists
2. **OTP sent to Telegram** → 6-digit code sent via LeaveBot
3. **User enters OTP** → System verifies code
4. **Login successful** → Session token generated

### OTP Security Features

- **5-minute expiry** - Codes expire after 5 minutes
- **One-time use** - Each code can only be used once
- **Rate limiting** - 30-second cooldown between requests
- **Telegram delivery** - Codes sent directly to user's Telegram account

### If OTP Doesn't Arrive

Users must have previously interacted with the LeaveBot on Telegram:
1. Open Telegram
2. Search for your bot name
3. Click "Start" or send `/start`
4. Then try logging in again

## API Security

### Authentication

All API endpoints require Bearer token authentication:

```http
Authorization: Bearer <token>
```

### Protected Endpoints

- `/api/employees` - Requires auth
- `/api/calendar` - Requires auth
- `/api/leave-requests` - Requires auth
- `/api/auth/register` - Requires admin/supervisor auth

### Public Endpoints

- `/api/auth/login` - Request OTP
- `/api/auth/verify` - Verify OTP and get token

## Security Best Practices

### For Deployment:

1. ✅ **Environment Variables**
   - Store all secrets in Vercel environment variables
   - Never commit `.env` files with real tokens

2. ✅ **HTTPS Only**
   - Vercel automatically provides HTTPS
   - All API calls are encrypted

3. ✅ **Token Validation**
   - All protected endpoints validate Bearer tokens
   - Invalid tokens are rejected with 401 Unauthorized

4. ✅ **Role-Based Access**
   - Endpoints check user roles before allowing actions
   - Supervisors cannot escalate to admin privileges

### For Production (Recommended Upgrades):

1. **JWT Tokens** - Replace simple Base64 tokens with signed JWT
2. **Database** - Move user storage from in-memory to PostgreSQL/MongoDB
3. **Rate Limiting** - Add API rate limiting to prevent abuse
4. **Session Management** - Implement token refresh and expiry
5. **Audit Logs** - Log all user registration and role changes

## Checking for Leaked Secrets

Run this command to search for potential token leaks:

```bash
git log --all --full-history --source --find-object="$(git hash-object path/to/.env)"
```

If you accidentally committed a token:
1. **Revoke it immediately** via @BotFather
2. **Generate new token** from @BotFather
3. **Update Vercel environment variables**
4. **Remove from Git history** using `git filter-branch` or BFG Repo-Cleaner

## Support

If you need to reset the admin password or recover access:
1. The admin account (`edgemadzi`) is hardcoded in `/api/_lib/users.ts`
2. You can always login with this account
3. Use this account to register new admins or reset other users

## Security Checklist

Before deploying to production:

- [ ] Bot token stored in Vercel environment variables
- [ ] `.env` files in `.gitignore`
- [ ] No tokens in code or documentation
- [ ] 2FA working correctly
- [ ] Role-based permissions tested
- [ ] All API endpoints require authentication
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Admin account secured
- [ ] Registration restricted to admins/supervisors
