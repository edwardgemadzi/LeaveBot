# ⚠️ Important: In-Memory Storage Limitation

## Current Issue: Session Expires After Function Restart

### Why This Happens:
- Vercel serverless functions are **stateless**
- Each function has its own memory space
- User data stored in memory is **lost when the function restarts**
- Functions restart due to:
  - Inactivity (cold starts)
  - Deployment updates
  - Scaling events
  - Platform maintenance

### Impact:
- ❌ Users registered will disappear after ~5-15 minutes of inactivity
- ❌ Sessions expire because user no longer exists in memory
- ❌ Not suitable for production use

### Solution: Use a Real Database

You MUST implement persistent storage for production. Here are your options:

---

## Option 1: Vercel KV (Redis) - Recommended ✅

**Best for:** Quick setup, serverless-friendly, built-in to Vercel

### Setup:
1. Go to Vercel Dashboard → Storage → Create KV Database
2. Link to your project
3. Install package:
   ```bash
   npm install @vercel/kv
   ```

### Update `api/shared/storage.js`:
```javascript
import { kv } from '@vercel/kv';

export async function getUserByUsername(username) {
  return await kv.hget('users', username);
}

export async function addUser(userData) {
  await kv.hset('users', userData.username, userData);
  return userData;
}

export async function getAllUsers() {
  return await kv.hgetall('users');
}
```

**Cost:** Free tier: 256 MB, 3000 commands/month

---

## Option 2: Vercel Postgres

**Best for:** Relational data, complex queries

### Setup:
1. Vercel Dashboard → Storage → Create Postgres Database
2. Install packages:
   ```bash
   npm install @vercel/postgres
   ```

### Create schema:
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE leaves (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  employee_name VARCHAR(100),
  start_date DATE,
  end_date DATE,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Cost:** Free tier: 256 MB, 256 MB storage

---

## Option 3: MongoDB Atlas

**Best for:** Document storage, flexible schema

### Setup:
1. Create free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Install package:
   ```bash
   npm install mongodb
   ```

### Add to environment:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/leavebot
```

**Cost:** Free tier: 512 MB storage

---

## Option 4: Supabase

**Best for:** Postgres + Auth + Storage all-in-one

### Setup:
1. Create project at [supabase.com](https://supabase.com)
2. Install package:
   ```bash
   npm install @supabase/supabase-js
   ```

**Cost:** Free tier: 500 MB database

---

## Quick Fix for Testing (Not Production)

If you just need to test and don't mind re-registering users:

### Set admin via environment variables:
In Vercel Dashboard → Settings → Environment Variables:
```
ADMIN_USERNAME=yourusername
ADMIN_PASSWORD=yourpassword
ADMIN_NAME=Your Name
JWT_SECRET=your-secret-here
```

This will recreate the admin user on every function cold start.

---

## Recommended Next Steps:

1. **Immediate:** Set admin credentials in environment variables
2. **Short term:** Implement Vercel KV (takes ~15 minutes)
3. **Long term:** Consider Vercel Postgres for production

Let me know which database option you'd like help implementing!
