# LeaveBot - Secure Leave Management System# 🗓️ LeaveBot - Employee Leave Management System



A secure web application for managing employee leave requests built with React, Vite, and Vercel serverless functions.A full-stack leave management application with a web interface and Telegram bot integration.



## Security Features ✅## 📋 Features



### 1. **Password Security**- **Calendar View** with color-coded leave statuses:

- ✅ Passwords hashed with **bcrypt** (industry standard)  - ⚪ **White** - Available days

- ✅ No plain text password storage  - ⚫ **Grey** - Booked/Pending approval

- ✅ Default password: `admin123` (already hashed in code)  - 🔴 **Red** - Approved leave

- **Employee Management** - Add and manage employees

### 2. **Authentication**- **Leave Requests** - Submit and track leave requests

- ✅ **JWT (JSON Web Tokens)** for secure sessions- **Supervisor Approval** - Review and approve pending requests

- ✅ Tokens expire after 24 hours- **Telegram Bot** - Book and manage leave via Telegram

- ✅ Bearer token authentication on all protected endpoints

- ✅ Automatic session expiry handling in frontend## 🏗️ Tech Stack



### 3. **Rate Limiting**### Backend (`/server`)

- ✅ Maximum 5 login attempts per username- **Express** + **TypeScript** - REST API server

- ✅ 15-minute lockout after failed attempts- **sql.js** - SQLite database (WASM-based, no native compilation)

- ✅ Prevents brute force attacks- **Zod** - Request validation

- **CORS** - Cross-origin resource sharing

### 4. **Input Validation & Sanitization**

- ✅ All inputs validated and sanitized### Frontend (`/client`)

- ✅ Length limits on all text fields- **React 18** + **TypeScript** - UI framework

- ✅ Date validation- **Vite** - Fast dev server and build tool

- ✅ Type checking- Calendar component with color-coded status indicators

- ✅ Prevents SQL injection and XSS attacks

### Bot (`/bot`)

### 5. **Secure Headers**- **node-telegram-bot-api** - Telegram Bot API

- ✅ `Strict-Transport-Security` (HTTPS only)- **TypeScript** - Type-safe bot commands

- ✅ `X-Content-Type-Options: nosniff`- Direct API integration with backend

- ✅ `X-Frame-Options: DENY` (prevents clickjacking)

- ✅ `X-XSS-Protection`## 🚀 Getting Started

- ✅ `Referrer-Policy`

- ✅ `Permissions-Policy` (blocks camera, microphone, etc.)### Prerequisites



### 6. **User Data Protection**- **Node.js** v18+ (tested with v23.11.0)

- ✅ Users can only see their own leave requests (unless admin)- **npm** v8+

- ✅ Token-based authorization on all endpoints- **Telegram Bot Token** (optional, for bot features)

- ✅ Username enumeration prevention (timing-safe password comparison)

### Installation

## Setup

```bash

1. **Install dependencies**# Clone the repository

   ```bashcd LeaveBot

   npm install

   ```# Install all dependencies (root + workspaces)

npm install

2. **Create `.env` file** (copy from `.env.example`)```

   ```bash

   cp .env.example .env### Configuration

   ```

#### Backend

3. **Generate strong JWT secret** (for production)The backend uses port **5001** by default. Create a `.env` file in `/server` if you need custom configuration:

   ```bash

   openssl rand -base64 32```bash

   ```PORT=5001

   Update `.env` with the generated secret:```

   ```

   JWT_SECRET=your-generated-secret-here#### Telegram Bot

   ```Create a `.env` file in `/bot`:



4. **Run development server**```bash

   ```bashTELEGRAM_BOT_TOKEN=your_bot_token_here

   npm run devAPI_BASE_URL=http://localhost:5001/api

   ``````



## Deployment to VercelTo get a Telegram bot token:

1. Message [@BotFather](https://t.me/botfather) on Telegram

1. **Set environment variables in Vercel dashboard:**2. Send `/newbot` and follow instructions

   - `JWT_SECRET` - Your strong random secret (NEVER commit this!)3. Copy the token provided



2. **Deploy:**### Running the Application

   ```bash

   git push origin main#### Start all services separately:

   ```

   Vercel will auto-deploy from GitHub.**Terminal 1 - Backend:**

```bash

## Default Login Credentialscd server

npm run dev

- **Username:** `edgemadzi````

- **Password:** `admin123`Backend runs on **http://localhost:5001**



⚠️ **IMPORTANT:** Change the default password hash in production!**Terminal 2 - Frontend:**

```bash

### How to generate a new password hash:cd client

npm run dev

```javascript```

const bcrypt = require('bcryptjs');Frontend runs on **http://localhost:5173**

const password = 'your-new-password';

const hash = bcrypt.hashSync(password, 10);**Terminal 3 - Telegram Bot (optional):**

console.log(hash);```bash

```cd bot

npm run dev

Then update the `passwordHash` in `/api/login.js`.```



## Security Best Practices#### Access the application:

- **Web UI**: http://localhost:5173

### For Production:- **API Health Check**: http://localhost:5001/health

1. ✅ Set strong `JWT_SECRET` environment variable in Vercel- **Telegram Bot**: Message your bot on Telegram

2. ✅ Change default password hash

3. ✅ Enable HTTPS only (Vercel does this by default)## 📱 Telegram Bot Commands

4. ✅ Regularly rotate JWT secrets

5. ✅ Monitor login attempts and failed authentications| Command | Description |

6. ✅ Use real database instead of in-memory storage|---------|-------------|

7. ✅ Implement proper logging and monitoring| `/start` | Welcome message and help |

8. ✅ Add CSRF protection if needed| `/help` | Show available commands |

9. ✅ Consider adding 2FA for admin accounts| `/book` | Book leave days |

10. ✅ Regular security audits| `/status` | Check leave request status |

| `/approve` | Approve pending requests (supervisors) |

### Known Limitations:

- ⚠️ In-memory storage (data resets on function restart) - Use database for production### Example Usage

- ⚠️ No email verification

- ⚠️ No password reset functionality**Book leave:**

- ⚠️ Simple rate limiting (use Redis for production)```

/book 1 2025-10-15 2025-10-17 Vacation

## API Endpoints```



### POST `/api/login`**Approve a request:**

Authenticate user and receive JWT token.```

/approve 1

**Request:**```

```json

{## 🔌 API Endpoints

  "username": "edgemadzi",

  "password": "admin123"### Employees

}- `GET /api/employees` - List all employees

```- `POST /api/employees` - Create new employee

  ```json

**Response:**  { "name": "John Doe" }

```json  ```

{

  "success": true,### Leave Requests

  "user": {- `GET /api/leave-requests` - List all leave requests

    "id": 1,- `POST /api/leave-requests` - Create leave request

    "username": "edgemadzi",  ```json

    "name": "Edward Gemadzi",  {

    "role": "admin"    "employeeId": 1,

  },    "startDate": "2025-10-15",

  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."    "endDate": "2025-10-17",

}    "reason": "Vacation"

```  }

  ```

### GET `/api/leaves`- `POST /api/leave-requests/:id/approve` - Approve request

Get all leave requests (requires authentication).

### Calendar

**Headers:**- `GET /api/calendar?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get calendar view

```

Authorization: Bearer <jwt-token>## 📁 Project Structure

```

```

### POST `/api/leaves`LeaveBot/

Submit new leave request (requires authentication).├── server/              # Backend API

│   ├── src/

**Headers:**│   │   ├── index.ts            # Main entry point

```│   │   ├── types.ts            # TypeScript types

Authorization: Bearer <jwt-token>│   │   ├── store/

Content-Type: application/json│   │   │   └── leaveStore.ts   # Database operations

```│   │   ├── routes/

│   │   │   └── api.ts          # API endpoints

**Request:**│   │   ├── middleware/

```json│   │   │   └── errorHandler.ts # Error handling

{│   │   └── utils/

  "employeeName": "John Doe",│   │       ├── dates.ts        # Date utilities

  "startDate": "2025-10-10",│   │       └── errors.ts       # Custom errors

  "endDate": "2025-10-15",│   ├── data/                    # SQLite database (auto-created)

  "reason": "Vacation"│   └── package.json

}├── client/              # React frontend

```│   ├── src/

│   │   ├── main.tsx            # Entry point

## Technology Stack│   │   ├── App.tsx             # Main component

│   │   ├── api.ts              # API client

- **Frontend:** React 18, TypeScript, Vite│   │   ├── types.ts            # TypeScript types

- **Backend:** Vercel Serverless Functions (Node.js)│   │   └── components/

- **Authentication:** JWT (jsonwebtoken)│   │       ├── Calendar.tsx    # Calendar view

- **Password Hashing:** bcrypt│   │       ├── LeaveRequestForm.tsx

- **Deployment:** Vercel│   │       └── PendingRequests.tsx

│   └── package.json

## License├── bot/                 # Telegram bot

│   ├── src/

MIT│   │   ├── index.ts            # Bot entry point

│   │   └── commands.ts         # Command handlers
│   ├── .env.example
│   └── package.json
└── package.json         # Root workspace config
```

## 🛠️ Development

### Build for Production

```bash
# Build all packages
npm run build

# Or build individually
cd server && npm run build
cd client && npm run build
cd bot && npm run build
```

### Linting

```bash
# Lint all packages
npm run lint
```

### Testing

```bash
# Run tests (when implemented)
npm test
```

## 🎨 Calendar Color Legend

| Color | Status | Description |
|-------|--------|-------------|
| ⚪ White | Available | No leave requests for this day |
| ⚫ Grey | Booked (Pending) | Leave requested, awaiting approval |
| 🔴 Red | Approved | Leave has been approved by supervisor |

## 🐛 Troubleshooting

### Backend won't start
- Check if port 5001 is available: `lsof -ti:5001`
- Ensure dependencies are installed: `npm install`

### Frontend can't connect to API
- Verify backend is running on port 5001
- Check `client/vite.config.ts` proxy configuration

### Telegram bot not responding
- Verify `TELEGRAM_BOT_TOKEN` is set correctly
- Check bot is running: `cd bot && npm run dev`
- Ensure API_BASE_URL points to backend

### Database issues
- Database file is at `server/data/leavebot.sqlite`
- To reset: delete the file and restart the server

## 📝 Notes

- **Database**: Uses SQLite via sql.js (WASM), data persists in `server/data/`
- **CORS**: Enabled for frontend development
- **Type Safety**: Full TypeScript coverage across all packages
- **ESM**: All packages use ES modules (`"type": "module"`)

## 🚀 Future Enhancements

- [ ] Add authentication/authorization
- [ ] Email notifications
- [ ] Multi-day selection in calendar
- [ ] Leave balance tracking
- [ ] Export calendar to iCal
- [ ] Admin dashboard
- [ ] Mobile app

## 📄 License

MIT

---

**Built with ❤️ using TypeScript, React, Express, and Telegram Bot API**
