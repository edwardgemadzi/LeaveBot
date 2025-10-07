# Leader Issues Audit Report
**Date:** October 7, 2025
**Status:** 🔴 CRITICAL ISSUES FOUND

---

## 🔴 **ISSUE 1: Dashboard Doesn't Recognize Leaders**

### Location: `src/components/Dashboard.tsx`

**Problem:**
```typescript
// Line 23 - User interface only has 'admin' | 'user'
interface User {
  role: 'admin' | 'user'  // ❌ Missing 'leader'
}

// Line 43-44 - Only checks for admin
if (user.role === 'admin') {
  // Admin sees all leaves statistics
} else {
  // User sees only their leaves  ❌ Leaders fall here!
}
```

**Impact:**
- ❌ Leaders see ONLY their own leaves (same as regular users)
- ❌ Leaders DON'T see team member requests
- ❌ Dashboard shows "My Dashboard" instead of "Team Dashboard"
- ❌ Leaders can't see pending approvals from their team
- ❌ Statistics only show leader's own leaves, not team

**Current Behavior:**
```
Leader logs in
  → Dashboard shows: "My Dashboard"
  → Stats: Only leader's own leaves
  → Pending: Only leader's own pending
  → Upcoming: Only leader's own upcoming
  → ❌ CANNOT see team member requests!
```

**Expected Behavior:**
```
Leader logs in
  → Dashboard shows: "Team Dashboard"
  → Stats: All team leaves
  → Pending: All team pending requests (for approval)
  → Upcoming: All team upcoming leaves
  → ✅ Full visibility of team
```

---

## 🔴 **ISSUE 2: Edit User Modal Missing Settings**

### Location: `src/components/UserManagement.tsx` lines 453-497

**Problem:**
```typescript
// Edit User Modal only has:
- Name input ✅
- Role dropdown ✅
- ❌ NO shift pattern
- ❌ NO shift time
- ❌ NO working days
- ❌ NO settings at all
```

**Impact:**
- ❌ Admins/Leaders can't set user shift patterns
- ❌ Can't configure working days for users
- ❌ Can't set shift times (day/night/rotating)
- ❌ Have to tell users to do it themselves
- ❌ No centralized user management

**Current Edit Modal:**
```
┌─────────────────────────┐
│ Edit User: John Doe     │
│                         │
│ Name: [John Doe      ]  │
│ Role: [User         ▼]  │
│                         │
│ [Cancel]  [Save]        │
└─────────────────────────┘
```

**Expected Edit Modal:**
```
┌──────────────────────────────┐
│ Edit User: John Doe          │
│                              │
│ Name: [John Doe          ]   │
│ Role: [User             ▼]   │
│                              │
│ Shift Settings               │
│ ├─ Pattern: [Regular    ▼]   │
│ ├─ Time: [Day          ▼]   │
│ └─ Working Days:             │
│    [✓] Mon [✓] Tue [✓] Wed  │
│    [✓] Thu [✓] Fri [ ] Sat  │
│    [ ] Sun                   │
│                              │
│ [Cancel]  [Save]             │
└──────────────────────────────┘
```

---

## 📊 **DETAILED ANALYSIS**

### Issue 1: Dashboard Role Check

**Files Affected:**
1. `src/components/Dashboard.tsx` (350 lines)
   - Line 23: User interface definition
   - Line 43: Admin check
   - Line 86: Upcoming leaves filter
   - Line 101: Recent activity filter
   - Line 113: Dashboard title
   - Line 117: Leave balance visibility

**Code Review:**
```typescript
// WRONG: Only checks for admin
if (user.role === 'admin') {
  // Show all team data
} else {
  // Show only user's data
  // ❌ Leaders fall into this block!
}

// CORRECT: Should check for admin OR leader
if (user.role === 'admin' || user.role === 'leader') {
  // Show all team data (filtered by team for leaders)
} else {
  // Show only user's data
}
```

**Backend vs Frontend Mismatch:**
- ✅ Backend: Correctly filters leaves by team for leaders
- ❌ Frontend Dashboard: Doesn't recognize leader role
- Result: Leaders get correct data but dashboard shows it wrong

---

### Issue 2: User Management Settings

**Current User Edit API:**
```typescript
// PUT /api/users?id={userId}
body: {
  name: string,
  role: string
}
// ❌ Doesn't accept settings
```

**User Settings API (Separate):**
```typescript
// PUT /api/users?id={userId}&action=settings
body: {
  settings: {
    shiftPattern: { type: string },
    shiftTime: { type: string },
    workingDays: { ... }
  }
}
// ✅ Exists but not integrated into User Management UI
```

**Problem:**
- Two separate endpoints for user data
- User Management modal doesn't use settings endpoint
- Settings only accessible via "My Settings" button (self-service only)
- No way for admins/leaders to configure user settings

---

## 🔧 **FIXES REQUIRED**

### Fix 1: Update Dashboard for Leaders

**File:** `src/components/Dashboard.tsx`

**Changes Needed:**
1. Update User interface to include 'leader'
2. Update all role checks to include leaders
3. Change dashboard title for leaders
4. Filter data by team for leaders (backend already does this)

**Code Changes:**
```typescript
// 1. Update interface (line 23)
interface User {
  id: string
  username: string
  name: string
  role: 'admin' | 'leader' | 'user'  // ✅ Add leader
}

// 2. Update stats logic (line 43)
if (user.role === 'admin' || user.role === 'leader') {
  // Admin/Leader sees all team statistics
  // Backend already filters leaves by team for leaders
  const approvedLeaves = leaves.filter(l => l.status === 'approved')
  // ... rest of logic
}

// 3. Update dashboard title (line 113)
{user.role === 'admin' 
  ? 'Admin Dashboard' 
  : user.role === 'leader'
    ? 'Team Dashboard'
    : 'My Dashboard'}

// 4. Update upcoming/recent filters (lines 86, 101)
if (user.role !== 'admin' && user.role !== 'leader') {
  filteredLeaves = leaves.filter(l => l.userId === user.id)
}
```

---

### Fix 2: Add Settings to User Edit Modal

**File:** `src/components/UserManagement.tsx`

**Changes Needed:**
1. Add state for user settings
2. Add settings form fields to modal
3. Update handleUpdateUser to save settings
4. Fetch user settings when editing
5. Add tabs: "Basic Info" and "Shift Settings"

**New State Variables:**
```typescript
const [editSettings, setEditSettings] = useState({
  shiftPattern: { type: 'regular' },
  shiftTime: { type: 'day' },
  workingDays: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false
  }
})
```

**Updated Modal Structure:**
```typescript
<div style={modalStyles}>
  <h3>Edit User: {editingUser.name}</h3>
  
  <Tabs>
    <Tab label="Basic Info">
      <Input label="Name" ... />
      <Select label="Role" ... />
    </Tab>
    
    <Tab label="Shift Settings">
      <Select label="Shift Pattern" options={['regular', '4on4off', 'rotating']} />
      <Select label="Shift Time" options={['day', 'night', 'rotating']} />
      <WorkingDaysCheckboxes ... />
    </Tab>
  </Tabs>
  
  <Buttons>
    <Cancel />
    <Save />
  </Buttons>
</div>
```

**Updated Save Logic:**
```typescript
async function handleUpdateUser() {
  // 1. Update basic info
  await fetch(`/api/users?id=${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ name, role })
  })
  
  // 2. Update settings
  await fetch(`/api/users?id=${userId}&action=settings`, {
    method: 'PUT',
    body: JSON.stringify({ settings: editSettings })
  })
}
```

---

## 📋 **IMPLEMENTATION CHECKLIST**

### Phase 1: Dashboard Fixes (Priority 1 - 15 minutes)
- [ ] Update User interface to include 'leader'
- [ ] Update stats calculation for leaders
- [ ] Update upcoming leaves filter
- [ ] Update recent activity filter
- [ ] Update dashboard title
- [ ] Update leave balance visibility
- [ ] Test leader dashboard shows team data

### Phase 2: User Management Settings (Priority 2 - 30 minutes)
- [ ] Add settings state to UserManagement
- [ ] Fetch user settings when editing
- [ ] Add shift pattern dropdown
- [ ] Add shift time dropdown
- [ ] Add working days checkboxes
- [ ] Update save function to call settings API
- [ ] Add tabs for better organization
- [ ] Test settings save correctly
- [ ] Test settings display correctly

---

## 🎯 **VERIFICATION TESTS**

### Test 1: Leader Dashboard
1. Login as leader
2. Check dashboard title → Should say "Team Dashboard"
3. Check pending count → Should show team pending, not just own
4. Check recent activity → Should show team activity
5. Submit leave as team member
6. Leader dashboard should show the new request

### Test 2: User Edit Settings
1. Login as admin/leader
2. Go to Team Management
3. Click "Edit" on a user
4. Should see shift settings options
5. Change shift pattern to "4on4off"
6. Change shift time to "night"
7. Uncheck Saturday/Sunday
8. Save
9. Check user's "My Settings" → Should reflect changes

---

## 📊 **IMPACT SUMMARY**

### Current State (Broken):
```
Leaders:
  ❌ Can't see team requests on dashboard
  ❌ Dashboard shows only own leaves
  ❌ Looks like a regular user
  ❌ Can't configure user shifts
  ❌ No centralized team management
  
Admins:
  ❌ Can't set user shift patterns
  ❌ Have to tell users to configure themselves
  ❌ No bulk user configuration
```

### After Fixes:
```
Leaders:
  ✅ See all team requests on dashboard
  ✅ Clear "Team Dashboard" title
  ✅ Can approve from dashboard view
  ✅ Can configure team member settings
  ✅ Full team visibility
  
Admins:
  ✅ Can configure user shifts
  ✅ Centralized user management
  ✅ Quick team setup
  ✅ No user training needed
```

---

## 🚨 **PRIORITY RATING**

| Issue | Severity | User Impact | Priority |
|-------|----------|-------------|----------|
| Dashboard not recognizing leaders | 🔴 CRITICAL | Leaders can't see team requests | **P0** |
| Edit modal missing settings | 🟠 HIGH | Poor admin/leader UX | **P1** |

**Recommended Action:** Fix both issues immediately. Issue 1 breaks core leader functionality.

---

**End of Report**
