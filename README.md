# LeaveBot - Secure Leave Management System

A secure web application for managing employee leave requests built with React, Vite, and Vercel serverless functions.

## 🔒 Security Features

### 1. **Password Security**
- ✅ Passwords hashed with **bcrypt** (industry standard)
- ✅ **NO hardcoded passwords in source code**
- ✅ Passwords must be minimum 8 characters

### 2. **Authentication**
- ✅ **JWT (JSON Web Tokens)** for secure sessions
- ✅ Tokens expire after 24 hours
- ✅ Bearer token authentication on all protected endpoints
- ✅ Automatic session expiry handling in frontend

### 3. **Rate Limiting**
- ✅ Maximum 5 login attempts per username
- ✅ 15-minute lockout after failed attempts
- ✅ Prevents brute force attacks

### 4. **Input Validation & Sanitization**
- ✅ All inputs validated and sanitized
- ✅ Length limits on all text fields
- ✅ Date validation
- ✅ Type checking
- ✅ Prevents SQL injection and XSS attacks

### 5. **Secure Headers**
- ✅ `Strict-Transport-Security` (HTTPS only)
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY` (prevents clickjacking)
- ✅ `X-XSS-Protection`
- ✅ `Referrer-Policy`
- ✅ `Permissions-Policy` (blocks camera, microphone, etc.)

### 6. **User Data Protection**
- ✅ Users can only see their own leave requests (unless admin)
- ✅ Token-based authorization on all endpoints
- ✅ Username enumeration prevention (timing-safe password comparison)

## 📦 Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create `.env` file** (copy from `.env.example`)
   ```bash
   cp .env.example .env
   ```

3. **Generate strong JWT secret** (for production)
   ```bash
   openssl rand -base64 32
   ```
   Update `.env` with the generated secret:
   ```
   JWT_SECRET=your-generated-secret-here
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Register your first user** (automatically becomes admin)
   - Visit http://localhost:5174
   - Click "Register"
   - Create your admin account
   - **First user registered is automatically admin!**

## 🚀 Deployment to Vercel

1. **Set environment variables in Vercel dashboard:**
   - `JWT_SECRET` - Your strong random secret (REQUIRED)
   - `ADMIN_USERNAME` - Optional: Initial admin username
   - `ADMIN_PASSWORD` - Optional: Initial admin password (min 8 chars)
   - `ADMIN_NAME` - Optional: Initial admin full name

   **Note:** If you don't set admin environment variables, the first user to register will become admin automatically.

2. **Deploy:**
   ```bash
   git push origin main
   ```
   Vercel will auto-deploy from GitHub.

## 👥 User Management & Roles

### Role-Based Access Control

#### **👑 Admin Role**
- **Purpose**: System administration and access management only
- **Capabilities**:
  - ✅ Create, edit, delete users and teams
  - ✅ Manage team assignments and leaders
  - ✅ Delete leave requests (for cleanup)
  - ✅ View all system data and statistics
- **Restrictions**:
  - ❌ Cannot request leaves (admin role is for management only)
  - ❌ Cannot access team calendars (no need for leave visibility)
  - ❌ Cannot approve/reject leaves (team leaders handle this)

#### **⭐ Team Leader Role**
- **Purpose**: Manage team members and approve leave requests
- **Capabilities**:
  - ✅ Create and manage team members
  - ✅ Approve/reject leave requests from team members
  - ✅ View team calendar and leave schedules
  - ✅ Request leaves for themselves
  - ✅ Configure team settings and defaults
- **Scope**: Limited to their assigned team only

#### **👤 Regular User Role**
- **Purpose**: Request leaves and view team calendar
- **Capabilities**:
  - ✅ Request leaves for themselves
  - ✅ View team calendar and leave schedules
  - ✅ See leave balance and available days
  - ✅ View their own leave history
- **Scope**: Limited to their team's calendar and their own requests

### First User Registration
- **First registered user automatically becomes admin**
- ✅ No hardcoded credentials in source code
- ✅ Register at: https://your-app.vercel.app

### Optional: Environment-Based Admin
You can create an admin user from Vercel environment variables:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `ADMIN_USERNAME=yourusername`
   - `ADMIN_PASSWORD=your-secure-password-min-8-chars`
   - `ADMIN_NAME=Your Full Name`
3. Redeploy the application

⚠️ **SECURITY:** Never commit credentials to code. Always use environment variables.

## 🔐 Security Best Practices

### For Production:
1. ✅ Set strong `JWT_SECRET` environment variable in Vercel (REQUIRED)
2. ✅ Use 8+ character passwords with complexity
3. ✅ Enable HTTPS only (Vercel does this by default)
4. ✅ Regularly rotate JWT secrets
5. ✅ Monitor login attempts and failed authentications
6. ✅ Use real database instead of in-memory storage
7. ✅ Implement proper logging and monitoring
8. ✅ Add CSRF protection if needed
9. ✅ Consider adding 2FA for admin accounts
10. ✅ Regular security audits

### Known Limitations:
- ⚠️ In-memory storage (data resets on function restart) - Use database for production
- ⚠️ No email verification
- ⚠️ No password reset functionality
- ⚠️ Simple rate limiting (use Redis for production)

## 📡 API Endpoints

### POST `/api/register`
Register a new user account.

**Request:**
```json
{
  "username": "johndoe",
  "password": "securepass123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "johndoe",
    "name": "John Doe",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "First user created as admin"
}
```

### POST `/api/login`
Authenticate user and receive JWT token.

**Request:**
```json
{
  "username": "johndoe",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "johndoe",
    "name": "John Doe",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET `/api/leaves`
Get all leave requests (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

### POST `/api/leaves`
Submit new leave request (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request:**
```json
{
  "employeeName": "John Doe",
  "startDate": "2025-10-10",
  "endDate": "2025-10-15",
  "reason": "Vacation"
}
```

## ✨ Key Features

### **📅 Leave Management**
- **Visual Calendar**: Interactive calendar showing team leave schedules
- **Leave Balance Tracking**: Real-time display of available leave days
- **Working Days Calculation**: Only counts working days based on user settings
- **Concurrent Leave Limits**: Prevents too many team members from being on leave simultaneously

### **👥 Team Management**
- **Team Isolation**: Each team sees only their own calendar and members
- **Role-Based Access**: Admin, Team Leader, and Regular User roles with appropriate permissions
- **Team Settings**: Configurable defaults for new team members
- **Member Management**: Leaders can create and manage team members

### **🔒 Security & Access Control**
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: All inputs sanitized and validated
- **Role-Based Permissions**: Granular access control based on user roles

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite
- **Backend:** Vercel Serverless Functions (Node.js)
- **Database:** MongoDB Atlas
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **Deployment:** Vercel

## 📝 License

MIT
