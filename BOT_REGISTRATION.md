# 🤖 Telegram Bot Registration Flow

## How It Works

When a user interacts with the LeaveBot on Telegram, the bot automatically checks if they are registered in the system.

### User Journey

#### 1. **Unregistered User** sends `/start`

The bot responds with:
```
👋 Hello, @username!

⚠️ You are not registered in the LeaveBot system yet.

To use this bot, you need to be registered by an administrator.

How to get registered:

1️⃣ If you're an admin:
   Visit https://leave-bot-wine.vercel.app
   Login and register yourself

2️⃣ If you're a team member:
   Ask your supervisor or administrator to:
   • Visit https://leave-bot-wine.vercel.app
   • Login to the system
   • Click "+ Register User"
   • Add your details with username: @username

3️⃣ Once registered:
   Come back here and send /start again!

❓ Need help? Contact your administrator.
```

#### 2. **Registered User** sends `/start`

The bot responds with:
```
👋 Welcome back, John Doe!

👤 Role: Team Member
📱 Username: @johndoe

🗓️ Leave Management:
/book - Request leave days
/calendar - View team calendar
/status - Check your leave requests

/help - Show this message again

🌐 Web Portal: https://leave-bot-wine.vercel.app

Get started by typing /book to request leave!
```

### Command Protection

All bot commands now verify the user is registered before executing:

- ✅ `/start` - Works for everyone, shows registration status
- ✅ `/help` - Works for everyone
- 🔒 `/book` - Requires registration
- 🔒 `/calendar` - Requires registration
- 🔒 `/status` - Requires registration
- 🔒 `/approve` - Requires registration + admin role
- 🔒 `/team` - Requires registration + supervisor/admin role
- 🔒 `/addmember` - Requires registration + supervisor/admin role

### Technical Flow

1. **User sends command** → Bot receives message
2. **Bot calls API** → `POST /api/telegram/check-user`
   - Sends: `telegram_username`, `chat_id`, `first_name`, `last_name`
3. **API checks database** → Looks up user by username
4. **API response:**
   - **If found:** Returns user info (id, name, role, etc.)
   - **If not found:** Returns 404 with registration instructions
5. **Bot takes action:**
   - **If registered:** Execute command normally
   - **If not registered:** Show registration instructions

### Chat ID Caching

The bot automatically caches the user's Telegram `chat_id` when they interact:
- This is used for OTP delivery during web login
- Ensures OTP messages reach the correct user
- No manual setup required

### Benefits

✅ **Security**: Only registered users can use the bot
✅ **User-friendly**: Clear instructions for getting registered
✅ **Automatic**: No manual verification needed
✅ **Role-aware**: Shows appropriate commands based on user role
✅ **Integrated**: Connects Telegram bot with web app registration

## Registration Process

### For New Users:

1. **Contact admin/supervisor** or visit web app if you're admin
2. **Admin/supervisor logs in** to https://leave-bot-wine.vercel.app
3. **Admin/supervisor clicks** "+ Register User"
4. **Fills in details:**
   - Full Name
   - Telegram Username (without @)
   - Role (Admin/Supervisor/Team Member)
5. **User receives confirmation** on web app
6. **User can now use bot** by sending `/start` on Telegram

### For Admins:

1. **Visit** https://leave-bot-wine.vercel.app
2. **Enter your Telegram username** (edgemadzi)
3. **Receive OTP** on Telegram bot
4. **Enter OTP** to login
5. **Click "+ Register User"** to add team members

## API Endpoint

### `POST /api/telegram/check-user`

**Request:**
```json
{
  "telegram_username": "johndoe",
  "chat_id": 123456789,
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response (Registered):**
```json
{
  "registered": true,
  "user": {
    "id": 2,
    "name": "John Doe",
    "telegram_username": "johndoe",
    "role": "team_member",
    "supervisor_id": 1
  },
  "message": "Welcome back, John Doe!"
}
```

**Response (Not Registered):**
```json
{
  "registered": false,
  "message": "You are not registered in the system yet.",
  "hint": "Please ask your administrator to register you via the web app...",
  "web_app_url": "https://leave-bot-wine.vercel.app"
}
```

## Testing

1. **Test as unregistered user:**
   - Use a Telegram account not in the system
   - Send `/start` to the bot
   - Verify registration instructions appear

2. **Test as registered user:**
   - Use your registered Telegram username (edgemadzi)
   - Send `/start` to the bot
   - Verify welcome message with role appears

3. **Test command protection:**
   - As unregistered user, try `/book` or `/calendar`
   - Verify you get "need to be registered" message

4. **Test registration flow:**
   - Login to web app
   - Register a new user
   - Have them send `/start` on Telegram
   - Verify they now see welcome message

## Notes

- Chat IDs are cached in memory (resets on API restart)
- In production, consider using Redis for chat ID caching
- User data stored in `/api/_lib/users.ts` (in-memory, use database in production)
- Bot token must be set in Vercel environment variables
