# 🔧 Authentication Integration - TODO List

## Current TypeScript Errors (4 files)

### 1. `/server/src/store/leaveStore.ts` - 3 errors

#### Error 1 & 2: Employee missing fields (lines 113, 135)
**Problem:** Employee interface now requires `user_id` and `supervisor_id`, but SQL queries only select `id, name, createdAt`

**Fix:**
```typescript
// Update line 102 SQL:
const sql = `SELECT id, name, user_id, supervisor_id, created_at as createdAt FROM employees`;

// Update line 113 result:
results.push({
  id: Number(row.id),
  name: String(row.name),
  user_id: Number(row.user_id),
  supervisor_id: Number(row.supervisor_id),
  createdAt: String(row.createdAt)
});

// Update line 128 SQL:
const sql = `SELECT id, name, user_id, supervisor_id, created_at as createdAt FROM employees WHERE id = $id`;

// Update line 135 return:
return {
  id: Number(row.id),
  name: String(row.name),
  user_id: Number(row.user_id),
  supervisor_id: Number(row.supervisor_id),
  createdAt: String(row.createdAt)
};
```

#### Error 3: LeaveRequest missing fields (line 367)
**Problem:** LeaveRequest interface requires `supervisorId` and `approvedBy`, but `mapLeaveRow()` doesn't return them

**Fix:**
```typescript
// Update line 367 (mapLeaveRow function):
return {
  id: Number(row.id),
  employeeId: Number(row.employee_id),
  employeeName: String(row.employee_name),
  supervisorId: Number(row.supervisor_id),  // ADD THIS
  startDate: String(row.start_date),
  endDate: String(row.end_date),
  status: String(row.status) as LeaveStatus,
  reason: row.reason ? String(row.reason) : null,
  createdAt: String(row.created_at),
  approvedAt: row.approved_at ? String(row.approved_at) : null,
  approvedBy: row.approved_by ? Number(row.approved_by) : null,  // ADD THIS
};

// Also update all SQL queries that use mapLeaveRow to SELECT these fields:
// Lines 242, 264, 286 - Add to SELECT:
// ..., lr.supervisor_id, lr.approved_by, ...
```

---

### 2. `/server/src/middleware/auth.ts` - 1 error

#### Error: Cannot find module '../store/authStore.js' (line 3)

**Fix:**
```typescript
// Change line 3:
import type { AuthStore } from "../store/authStore.js";
// To:
import type { AuthStore } from "../store/authStore";
```

---

### 3. `/server/src/routes/auth.ts` - 3 errors

#### Error: asyncHandler return type mismatch (lines 51, 73, 123)

**Problem:** Handlers return `Promise<Response | undefined>` but should return `Promise<void>`

**Fix:** Don't return the `res.json()` call:
```typescript
// BAD:
return res.json({ message: "Success" });

// GOOD:
res.json({ message: "Success" });
return;
```

**Locations to fix:**
- Line ~51: Login handler
- Line ~73: Logout handler  
- Line ~123: Create user handler

---

## Additional Integration Tasks

### Task 1: Add `createEmployee` supervisor_id parameter
**File:** `/server/src/store/leaveStore.ts` line ~148

**Current:**
```typescript
async createEmployee(name: string): Promise<Employee>
```

**Update to:**
```typescript
async createEmployee(name: string, userId: number, supervisorId: number): Promise<Employee>
```

**SQL Update:**
```typescript
const sql = `
  INSERT INTO employees (name, user_id, supervisor_id, created_at) 
  VALUES ($name, $userId, $supervisorId, datetime('now'))
`;
// ... bind $userId and $supervisorId
```

---

### Task 2: Add supervisor filtering to queries
**File:** `/server/src/store/leaveStore.ts`

**Methods to update:**
1. `listEmployees()` - Add optional `supervisorId` param, filter WHERE
2. `getLeaveRequests()` - Add supervisor filtering
3. `getPendingRequests()` - Add supervisor filtering

**Example:**
```typescript
async listEmployees(supervisorId?: number): Promise<Employee[]> {
  let sql = `SELECT id, name, user_id, supervisor_id, created_at as createdAt FROM employees`;
  const params: any = {};
  
  if (supervisorId !== undefined) {
    sql += ` WHERE supervisor_id = $supervisorId`;
    params.$supervisorId = supervisorId;
  }
  
  // ... rest of query
}
```

---

### Task 3: Update `createLeaveRequest` to store supervisor_id
**File:** `/server/src/store/leaveStore.ts` line ~164

**Update SQL:**
```typescript
const sql = `
  INSERT INTO leave_requests (employee_id, supervisor_id, start_date, end_date, status, reason, created_at) 
  VALUES ($employeeId, $supervisorId, $startDate, $endDate, 'pending', $reason, datetime('now'))
`;
```

**Add parameter:**
```typescript
async createLeaveRequest(
  employeeId: number,
  supervisorId: number,  // ADD THIS
  startDate: string,
  endDate: string,
  reason?: string
): Promise<LeaveRequest>
```

---

### Task 4: Update `approveLeaveRequest` to store approved_by
**File:** `/server/src/store/leaveStore.ts` line ~188

**Update SQL:**
```typescript
const sql = `
  UPDATE leave_requests 
  SET status = 'approved', 
      approved_at = datetime('now'),
      approved_by = $approvedBy
  WHERE id = $id
`;
```

**Add parameter:**
```typescript
async approveLeaveRequest(id: number, approvedBy: number): Promise<void>
```

---

### Task 5: Mount auth routes in main app
**File:** `/server/src/index.ts`

**Add:**
```typescript
import authRouter from "./routes/auth.js";
import { AuthStore } from "./store/authStore.js";

const authStore = new AuthStore();
await authStore.open();

app.use("/auth", authRouter(authStore));
```

---

### Task 6: Protect existing API routes
**File:** `/server/src/routes/api.ts`

**Add auth middleware:**
```typescript
import { createAuthMiddleware, requireRole } from "../middleware/auth.js";

export default function apiRouter(leaveStore: LeaveStore, authStore: AuthStore): Router {
  const router = Router();
  const auth = createAuthMiddleware(authStore);
  
  // Apply auth to all routes
  router.use(auth);
  
  // Role-based protection examples:
  router.get("/employees", async (req: AuthenticatedRequest, res) => {
    // Filter by supervisor if not admin
    const supervisorId = req.auth.role === "admin" ? undefined : req.auth.userId;
    const employees = await leaveStore.listEmployees(supervisorId);
    res.json(employees);
  });
  
  // etc...
}
```

---

### Task 7: Create admin initialization endpoint
**File:** `/server/src/routes/auth.ts`

**Add route:**
```typescript
// Allow creating first admin user if no users exist
router.post("/register-admin", asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  // Check if any users exist
  const existingUsers = await authStore.listAllUsers();
  if (existingUsers.length > 0) {
    throw new AppError("Admin user already exists", 403);
  }
  
  const user = await authStore.createUser(name, email, password, "admin", null);
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}));
```

---

## Priority Order

1. **HIGH** - Fix TypeScript errors (can't compile without these)
   - [ ] Fix authStore import in middleware/auth.ts
   - [ ] Fix Employee queries in leaveStore.ts
   - [ ] Fix LeaveRequest mapper in leaveStore.ts
   - [ ] Fix return types in routes/auth.ts

2. **HIGH** - Integration
   - [ ] Update createEmployee signature
   - [ ] Update createLeaveRequest signature
   - [ ] Update approveLeaveRequest signature
   - [ ] Mount auth routes in index.ts
   - [ ] Add admin init endpoint

3. **MEDIUM** - Add filtering
   - [ ] Add supervisor filtering to listEmployees
   - [ ] Add supervisor filtering to getLeaveRequests
   - [ ] Update API routes with auth middleware
   - [ ] Add permission checks in API handlers

4. **LOW** - Frontend & Bot
   - [ ] Frontend login page
   - [ ] Frontend role-based UI
   - [ ] Telegram bot auth

---

## Quick Start Commands

Once fixes are complete:

```bash
# 1. Start backend
cd /Users/edward/LeaveBot/server
npm run dev

# 2. Create admin account
curl -X POST http://localhost:5001/auth/register-admin \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@leavebot.com","password":"admin123"}'

# 3. Login as admin
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@leavebot.com","password":"admin123"}'

# 4. Use token for authenticated requests
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/auth/users/me
```
