# 🗓️ LeaveBot - Employee Leave Management System

A full-stack leave management application with a web interface and Telegram bot integration.

## 📋 Features

- **Calendar View** with color-coded leave statuses:
  - ⚪ **White** - Available days
  - ⚫ **Grey** - Booked/Pending approval
  - 🔴 **Red** - Approved leave
- **Employee Management** - Add and manage employees
- **Leave Requests** - Submit and track leave requests
- **Supervisor Approval** - Review and approve pending requests
- **Telegram Bot** - Book and manage leave via Telegram

## 🏗️ Tech Stack

### Backend (`/server`)
- **Express** + **TypeScript** - REST API server
- **sql.js** - SQLite database (WASM-based, no native compilation)
- **Zod** - Request validation
- **CORS** - Cross-origin resource sharing

### Frontend (`/client`)
- **React 18** + **TypeScript** - UI framework
- **Vite** - Fast dev server and build tool
- Calendar component with color-coded status indicators

### Bot (`/bot`)
- **node-telegram-bot-api** - Telegram Bot API
- **TypeScript** - Type-safe bot commands
- Direct API integration with backend

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ (tested with v23.11.0)
- **npm** v8+
- **Telegram Bot Token** (optional, for bot features)

### Installation

```bash
# Clone the repository
cd LeaveBot

# Install all dependencies (root + workspaces)
npm install
```

### Configuration

#### Backend
The backend uses port **5001** by default. Create a `.env` file in `/server` if you need custom configuration:

```bash
PORT=5001
```

#### Telegram Bot
Create a `.env` file in `/bot`:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
API_BASE_URL=http://localhost:5001/api
```

To get a Telegram bot token:
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow instructions
3. Copy the token provided

### Running the Application

#### Start all services separately:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
Backend runs on **http://localhost:5001**

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
Frontend runs on **http://localhost:5173**

**Terminal 3 - Telegram Bot (optional):**
```bash
cd bot
npm run dev
```

#### Access the application:
- **Web UI**: http://localhost:5173
- **API Health Check**: http://localhost:5001/health
- **Telegram Bot**: Message your bot on Telegram

## 📱 Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and help |
| `/help` | Show available commands |
| `/book` | Book leave days |
| `/status` | Check leave request status |
| `/approve` | Approve pending requests (supervisors) |

### Example Usage

**Book leave:**
```
/book 1 2025-10-15 2025-10-17 Vacation
```

**Approve a request:**
```
/approve 1
```

## 🔌 API Endpoints

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee
  ```json
  { "name": "John Doe" }
  ```

### Leave Requests
- `GET /api/leave-requests` - List all leave requests
- `POST /api/leave-requests` - Create leave request
  ```json
  {
    "employeeId": 1,
    "startDate": "2025-10-15",
    "endDate": "2025-10-17",
    "reason": "Vacation"
  }
  ```
- `POST /api/leave-requests/:id/approve` - Approve request

### Calendar
- `GET /api/calendar?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get calendar view

## 📁 Project Structure

```
LeaveBot/
├── server/              # Backend API
│   ├── src/
│   │   ├── index.ts            # Main entry point
│   │   ├── types.ts            # TypeScript types
│   │   ├── store/
│   │   │   └── leaveStore.ts   # Database operations
│   │   ├── routes/
│   │   │   └── api.ts          # API endpoints
│   │   ├── middleware/
│   │   │   └── errorHandler.ts # Error handling
│   │   └── utils/
│   │       ├── dates.ts        # Date utilities
│   │       └── errors.ts       # Custom errors
│   ├── data/                    # SQLite database (auto-created)
│   └── package.json
├── client/              # React frontend
│   ├── src/
│   │   ├── main.tsx            # Entry point
│   │   ├── App.tsx             # Main component
│   │   ├── api.ts              # API client
│   │   ├── types.ts            # TypeScript types
│   │   └── components/
│   │       ├── Calendar.tsx    # Calendar view
│   │       ├── LeaveRequestForm.tsx
│   │       └── PendingRequests.tsx
│   └── package.json
├── bot/                 # Telegram bot
│   ├── src/
│   │   ├── index.ts            # Bot entry point
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
