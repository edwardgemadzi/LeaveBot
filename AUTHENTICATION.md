# 🔐 LeaveBot Authentication & Authorization System

## ✅ IMPLEMENTATION STATUS: COMPLETE

**Web authentication is now live!** Visit https://leave-bot-wine.vercel.app and login with your Telegram username.

### Quick Login Guide

**Admin Access:**
- Username: `edgemadzi` (your Telegram username)
- Full access to all features including approving requests

**Team Members:**
- Username: `teammember1` or `teammember2` (demo accounts)
- Can view calendar and submit leave requests

All API endpoints are now protected and require authentication. The system shows your role badge (Admin/Supervisor) next to your name in the header.

---

## Overview

This document outlines the multi-role authentication system being added to LeaveBot with three user roles:
- **Admin** (Developer) - Full system access
- **Supervisor** - Manages their own team
- **Team Member** - Books leave for themselves

## 🎯 Role Permissions

### Admin
- ✅ Create/delete supervisors
- ✅ Create/delete team members for any supervisor
- ✅ View all teams and supervisors
- ✅ Approve any leave request
- ✅ Input leave for any team member

### Supervisor
- ✅ Create/delete team members in their own team
- ✅ View only their own team members
- ✅ Approve leave requests for their team
- ✅ Input leave for their team members
- ❌ Cannot view other supervisors' teams
- ❌ Cannot create other supervisors

### Team Member
- ✅ Book leave for themselves
- ✅ View their own leave requests
- ❌ Cannot approve leave
- ❌ Cannot view other team members

## 📋 Database Schema Changes

### New Tables

#### `users` table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'supervisor', 'team_member')),
  supervisor_id INTEGER REFERENCES users(id), -- null for admin/supervisor
  telegram_id TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### `sessions` table
```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Modified Tables

#### `employees` table (updated)
```sql
CREATE TABLE employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  user_id INTEGER UNIQUE REFERENCES users(id), -- Link to user account
  supervisor_id INTEGER NOT NULL REFERENCES users(id), -- Who manages this employee
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### `leave_requests` table (updated)
```sql
CREATE TABLE leave_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  supervisor_id INTEGER NOT NULL REFERENCES users(id), -- For filtering
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TEXT,
  approved_by INTEGER REFERENCES users(id) -- Who approved it
);
```

## 🔑 Authentication Flow

### 1. Login
```
POST /auth/login
Body: { "email": "user@example.com", "password": "password123" }

Response: {
  "token": "abc123...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "supervisor",
    "supervisorId": null
  }
}
```

### 2. Authenticated Requests
```
Authorization: Bearer abc123...
```

### 3. Logout
```
POST /auth/logout
Headers: Authorization: Bearer abc123...
```

## 🛣️ New API Endpoints

### Authentication Routes (`/auth`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/auth/login` | ❌ | Any | Login and get token |
| POST | `/auth/logout` | ✅ | Any | Invalidate token |
| GET | `/auth/users/me` | ✅ | Any | Get current user info |
| POST | `/auth/users` | ✅ | Admin, Supervisor | Create new user |
| GET | `/auth/team-members` | ✅ | Admin, Supervisor | Get team members |
| GET | `/auth/supervisors` | ✅ | Admin | Get all supervisors |
| DELETE | `/auth/users/:id` | ✅ | Admin, Supervisor | Delete user |

### Modified Leave Routes

All leave request endpoints now require authentication and respect supervisor boundaries:

- Supervisors only see/manage their team's requests
- Team members only see their own requests
- Admins see everything

## 🔄 Migration Steps

### Step 1: Initialize Admin Account
First user created should be admin:

```bash
# After starting the server, create admin account
curl -X POST http://localhost:5001/auth/register-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@leavebot.com",
    "password": "your_secure_password"
  }'
```

### Step 2: Create Supervisors (as Admin)
```bash
curl -X POST http://localhost:5001/auth/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Supervisor Name",
    "email": "supervisor@company.com",
    "password": "temp_password",
    "role": "supervisor"
  }'
```

### Step 3: Create Team Members (as Supervisor or Admin)
```bash
curl -X POST http://localhost:5001/auth/users \
  -H "Authorization: Bearer YOUR_SUPERVISOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Team Member Name",
    "email": "member@company.com",
    "password": "temp_password",
    "role": "team_member",
    "supervisorId": 2
  }'
```

## 🎨 Frontend Changes Needed

### 1. Login Page
- Add login form
- Store token in localStorage
- Redirect after login based on role

### 2. Protected Routes
- Wrap components with auth check
- Pass user role to components
- Show/hide features based on role

### 3. Dashboard Views

#### Admin Dashboard
- List all supervisors
- Create/delete supervisors
- View all teams
- Approve any leave

#### Supervisor Dashboard
- List team members
- Create/delete team members
- View team calendar
- Approve team leave requests

#### Team Member Dashboard
- Book own leave
- View own requests
- See team calendar (read-only)

## 🤖 Telegram Bot Changes

### Link Telegram Account
```
/link email@example.com
```
Bot sends verification code, user enters it to link account.

### Role-Based Commands

#### Admin
- All commands available

#### Supervisor
- `/book <team_member_id> <dates>` - Book for team
- `/approve <request_id>` - Approve team requests
- `/team` - View team members
- `/pending` - View pending requests

#### Team Member
- `/book <dates>` - Book own leave
- `/status` - View own requests

## 🔒 Security Notes

### Password Storage
- Passwords hashed with PBKDF2 (10,000 iterations)
- 64-byte salt per password
- **Production:** Switch to `bcrypt` or `argon2`

### Session Tokens
- 32-byte random tokens
- 30-day expiry
- Stored in database
- Invalidated on logout

### API Security
- All endpoints (except login) require authentication
- Role-based access control on routes
- Supervisor isolation (can't see other teams)
- Input validation with Zod

## 📝 Example Workflows

### Workflow 1: New Team Member Books Leave

1. Team member logs in via web or Telegram
2. Selects dates on calendar or uses `/book` command
3. Request created with status "pending"
4. Supervisor notified
5. Supervisor approves via dashboard or `/approve`
6. Calendar updates to show approved leave (red)

### Workflow 2: Supervisor Books Leave for Team Member

1. Supervisor logs in
2. Selects team member from dropdown
3. Books leave on their behalf
4. Request auto-approved (supervisor booking)
5. Calendar updates immediately

### Workflow 3: Admin Onboards New Supervisor

1. Admin creates supervisor account
2. Sends credentials to supervisor
3. Supervisor logs in, changes password
4. Supervisor creates team members
5. Team members receive credentials
6. Team members can start booking

## 🚀 Implementation Status

- [x] Database schema designed
- [x] Auth types defined
- [x] AuthStore implementation
- [x] Auth middleware
- [x] Auth routes
- [ ] Update LeaveStore for multi-tenancy
- [ ] Update API routes with auth
- [ ] Frontend login page
- [ ] Frontend role-based UI
- [ ] Telegram bot auth
- [ ] Admin registration endpoint
- [ ] Documentation
- [ ] Testing

## 🛠️ Next Steps

1. **Fix LeaveStore** - Update all methods to include `supervisor_id` filtering
2. **Update API Routes** - Add auth middleware to existing routes
3. **Add Admin Init** - Create special endpoint for first admin user
4. **Update Frontend** - Build login, protected routes, role-based UI
5. **Update Bot** - Add account linking and role-based commands
6. **Test** - End-to-end testing of all role scenarios

---

**Note:** This is a major architectural change. Consider creating a migration script to handle existing data.
