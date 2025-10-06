# API Consolidation Migration Guide

## Problem
Vercel Hobby plan limits deployments to 12 serverless functions. We had 13+ functions which exceeded the limit.

## Solution
Consolidated related API endpoints into single files using query parameters instead of nested routes.

---

## Changes Made

### 1. Users API (`/api/users.js`)

**Before:** 3 separate files
- `/api/users/index.js` - List users
- `/api/users/[id].js` - Get/Update/Delete specific user  
- `/api/users/create.js` - Create new user

**After:** 1 consolidated file (`/api/users.js`)
- `GET /api/users` - List all users
- `GET /api/users?id=xxx` - Get specific user
- `POST /api/users` - Create new user
- `PUT /api/users?id=xxx` - Update user (including password)
- `DELETE /api/users?id=xxx` - Delete user

**Frontend Changes Required:**
```typescript
// OLD
fetch('/api/users/create', { method: 'POST', ... })
fetch(`/api/users/${id}`, { method: 'PUT', ... })
fetch(`/api/users/${id}/password`, { method: 'PUT', ... })
fetch(`/api/users/${id}`, { method: 'DELETE', ... })

// NEW
fetch('/api/users', { method: 'POST', ... })
fetch(`/api/users?id=${id}`, { method: 'PUT', ... })
fetch(`/api/users?id=${id}`, { method: 'PUT', body: JSON.stringify({ password }) })
fetch(`/api/users?id=${id}`, { method: 'DELETE', ... })
```

**Files to Update:**
- `src/components/UserManagement.tsx` (lines 75, 108, 138, 181)

---

### 2. Teams API (`/api/teams.js`)

**Before:** 5 separate files
- `/api/teams/index.js` - List teams
- `/api/teams/[id].js` - Get/Update/Delete specific team
- `/api/teams/[id]/assign.js` - Assign user to team
- `/api/teams/[id]/remove.js` - Remove user from team

**After:** 1 consolidated file (`/api/teams.js`)
- `GET /api/teams` - List all teams
- `GET /api/teams?id=xxx` - Get specific team with members
- `POST /api/teams` - Create new team
- `POST /api/teams?id=xxx&action=assign` - Assign user to team
- `POST /api/teams?id=xxx&action=remove` - Remove user from team
- `PUT /api/teams?id=xxx` - Update team
- `DELETE /api/teams?id=xxx` - Delete team

**Frontend Changes Required:**
```typescript
// OLD
fetch(`/api/teams/${id}`, { method: 'GET', ... })
fetch(`/api/teams/${id}`, { method: 'PUT', ... })
fetch(`/api/teams/${id}`, { method: 'DELETE', ... })
fetch(`/api/teams/${id}/assign`, { method: 'POST', ... })
fetch(`/api/teams/${id}/remove`, { method: 'POST', ... })

// NEW
fetch(`/api/teams?id=${id}`, { method: 'GET', ... })
fetch(`/api/teams?id=${id}`, { method: 'PUT', ... })
fetch(`/api/teams?id=${id}`, { method: 'DELETE', ... })
fetch(`/api/teams?id=${id}&action=assign`, { method: 'POST', ... })
fetch(`/api/teams?id=${id}&action=remove`, { method: 'POST', ... })
```

**Files to Update:**
- ✅ `src/components/TeamManagement.tsx` - ALREADY UPDATED

---

## Final API Count

**After consolidation:**
1. `/api/balance.js`
2. `/api/leaves.js`
3. `/api/login.js`
4. `/api/register.js`
5. `/api/users.js` ✨ (consolidates 3 endpoints)
6. `/api/teams.js` ✨ (consolidates 5 endpoints)

**Total: 6 serverless functions** ✅ (well under the 12 limit!)

---

## Files to Delete

After frontend is updated and tested, delete these old API folders:
```
api/users/
├── index.js
├── [id].js
└── create.js

api/teams/
├── index.js
├── [id].js
└── [id]/
    ├── assign.js
    └── remove.js
```

---

## Testing Checklist

- [ ] User management: List users
- [ ] User management: Create user
- [ ] User management: Edit user
- [ ] User management: Delete user
- [ ] User management: Change password
- [ ] Team management: List teams
- [ ] Team management: Create team
- [ ] Team management: Edit team
- [ ] Team management: Delete team
- [ ] Team management: View members
- [ ] Team management: Assign user to team
- [ ] Team management: Remove user from team
- [ ] Registration: Select team during signup
- [ ] Deploy to Vercel without function limit error

---

## Rollback Plan

If issues occur:
1. `git revert <commit-hash>`
2. The old API structure will be restored
3. Frontend will work with old routes again

---

**Author**: AI Assistant  
**Date**: October 6, 2025  
**Reason**: Vercel Hobby plan function limit exceeded (13 > 12)
