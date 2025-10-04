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

## 👥 User Management

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

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite
- **Backend:** Vercel Serverless Functions (Node.js)
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **Deployment:** Vercel

## 📝 License

MIT
