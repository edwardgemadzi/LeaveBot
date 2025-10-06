# API Endpoint Audit

## Current Endpoints Status ✅

### 1. Authentication Endpoints
- `POST /api/login` - User login ✅
  - Body: `{ username, password }`
  - Returns: `{ token, user }`
  
- `POST /api/register` - User registration ✅
  - Body: `{ username, password, name, teamId? }`
  - Returns: `{ token, user }`

### 2. Users Management
- `GET /api/users` - List all users ✅
  - Auth: Admin/Leader
  - Returns: `{ users: [] }`

- `POST /api/users?action=create` - Create user ✅
  - Auth: Admin/Leader
  - Body: `{ username, password, name, role, teamId? }`
  - Returns: `{ message, user }`

- `POST /api/users?action=password` - Change password ✅
  - Auth: Admin only
  - Body: `{ userId, newPassword }`
  - Returns: `{ message }`

- `PUT /api/users?id={userId}` - Update user ✅
  - Auth: Admin/Leader
  - Body: `{ name?, role? }`
  - Returns: `{ message }`

- `DELETE /api/users?id={userId}` - Delete user ✅
  - Auth: Admin only
  - Cascades: Deletes all leave requests
  - Returns: `{ message }`

### 3. Teams Management
- `GET /api/teams` - List all teams ✅
  - Auth: Admin/Leader (leaders see only their teams)
  - Returns: `{ teams: [] }`

- `GET /api/teams?id={teamId}` - Get team details ✅
  - Auth: Admin/Leader
  - Returns: `{ team: { members: [] } }`

- `POST /api/teams` - Create team ✅
  - Auth: Admin only
  - Body: `{ name, description?, leaderId? }`
  - Returns: `{ message, team }`

- `PUT /api/teams?id={teamId}` - Update team ✅
  - Auth: Admin only
  - Body: `{ name?, description?, leaderId? }`
  - Returns: `{ message }`

- `DELETE /api/teams?id={teamId}` - Delete team ✅
  - Auth: Admin only
  - Cascades: Unassigns all users
  - Returns: `{ message }`

- `POST /api/teams?id={teamId}&action=assign` - Assign user ✅
  - Auth: Admin/Leader (own team)
  - Body: `{ userId }`
  - Returns: `{ message }`

- `POST /api/teams?id={teamId}&action=remove` - Remove user ✅
  - Auth: Admin/Leader (own team)
  - Body: `{ userId }`
  - Returns: `{ message }`

### 4. Leave Requests
- `GET /api/leaves` - List leaves ✅
  - Auth: All users
  - Returns: User's leaves or all leaves (admin)
  - Returns: `{ leaves: [] }`

- `POST /api/leaves` - Create leave request ✅
  - Auth: All users
  - Body: `{ employeeName, startDate, endDate, reason? }`
  - Returns: `{ success, leave }`

- `PUT /api/leaves/{leaveId}` - Update leave status ✅
  - Auth: Admin only
  - Body: `{ status: 'approved' | 'rejected' }`
  - Returns: `{ success, message }`

### 5. Leave Balance
- `GET /api/balance?userId={userId}&year={year}` - Get balance ✅
  - Auth: All users
  - Returns: `{ balance: { available, used, pending } }`

---

## Recommended New Endpoints for Team Settings

### Team Settings (NEW)
- `GET /api/teams?id={teamId}&action=settings` - Get team settings
  - Auth: Admin/Leader (own team)
  - Returns: Team-specific leave policies

- `PUT /api/teams?id={teamId}&action=settings` - Update settings
  - Auth: Admin/Leader (own team)
  - Body: Shift patterns, concurrent limits, etc.

---

## All Endpoints Working Correctly ✅
- All frontend calls match backend implementations
- Proper authorization checks in place
- Consistent query parameter usage
- Rate limiting and validation active
