# Calendar Synchronization & Real-Time Updates Audit
**Date:** October 7, 2025
**Status:** 🔴 CRITICAL ISSUES FOUND

---

## 🔍 **CURRENT BEHAVIOR ANALYSIS**

### Data Flow Overview
```
User Action → API Update → Component Callback → loadLeaves() → State Update → Calendar Re-render
```

---

## ❌ **CRITICAL ISSUES FOUND**

### 🔴 **ISSUE 1: Calendar NOT Updated After Leave Requests**
**Location:** `src/App.tsx` lines 488-498

**Current Code:**
```tsx
{currentView === 'calendar' && (
  <InteractiveCalendar 
    user={user} 
    leaves={leaves}
    onRequestLeave={(startDate, endDate) => {
      setStartDate(startDate.toISOString().split('T')[0])
      setEndDate(endDate.toISOString().split('T')[0])
      setEmployeeName(user.name)
      setCurrentView('form')
    }}
  />
)}
```

**Problem:** 
- Calendar receives `leaves` prop from parent state
- When user submits a leave from the form (`handleSubmitLeave`), it calls `loadLeaves()`
- BUT if user is viewing the calendar and switches to another view, calendar is unmounted
- When they switch back to calendar, it DOES show updated data
- **HOWEVER:** If another user submits a leave, the current user's calendar is NOT updated

**Impact:**
- ❌ User doesn't see their new leave request on calendar immediately
- ❌ Other users don't see new leave requests without refreshing
- ❌ Admins/Leaders don't see pending approvals on calendar without refresh
- ❌ Multi-user environment has stale data

---

### 🔴 **ISSUE 2: No Auto-Refresh When Leaves Are Approved/Rejected**
**Location:** `src/App.tsx` line 673

**Current Code:**
```tsx
<LeaveCard 
  key={leave.id} 
  leave={leave} 
  isAdmin={user.role === 'admin' || user.role === 'leader'}
  onStatusUpdate={() => loadLeaves()}  // ✅ This works for the list view
  token={token}
  showToast={success}
  showError={showError}
/>
```

**Problem:**
- When admin/leader approves a leave in **List View**, `loadLeaves()` is called ✅
- But if user is viewing **Calendar**, the calendar doesn't auto-refresh
- **Scenario:**
  1. User A on calendar view
  2. Leader approves User A's leave
  3. User A's calendar still shows "pending" until manual refresh
  
**Impact:**
- ❌ Calendar data becomes stale after approvals
- ❌ Users don't know their leave was approved without checking list
- ❌ Confusion about actual leave status

---

### 🔴 **ISSUE 3: No Polling or WebSocket for Multi-User Sync**

**Current Architecture:**
- **Data fetch:** Only on mount and manual actions
- **No polling:** App doesn't periodically check for updates
- **No WebSockets:** No real-time push notifications
- **No Server-Sent Events (SSE):** No live updates

**Problem Scenarios:**

**Scenario A - Team Leader Workflow:**
```
Time  User A (Regular)           Leader B
----  --------------------       -----------------------
10:00 Submits leave request    
      Sees "pending" on calendar
10:05                           Approves leave (List view)
10:06 Still sees "pending"     ← User A doesn't know!
10:10 Manually refreshes        Now sees "approved" ✅
```

**Scenario B - Team Coordination:**
```
Time  User A                    User B (Same team)
----  --------------------      -----------------------
09:00 Requests Dec 25-26       
09:05                          Requests Dec 25-27
      ← Doesn't see conflict!
09:10 Both submitted            System now has overlap!
```

**Impact:**
- ❌ No real-time collaboration
- ❌ Users work with stale data
- ❌ Concurrent leave conflicts not visible
- ❌ Poor user experience in multi-user environment

---

### 🟡 **ISSUE 4: Calendar Filtering Logic Broken**
**Location:** `src/components/InteractiveCalendar.tsx` lines 57-82

**Current Code:**
```tsx
if (user.role === 'admin') {
  // Admins see all leaves (no filter)
} else if (user.role === 'leader') {
  if (showTeamOnly && user.teamId) {
    filteredLeaves = leaves.filter(l => {
      const leaveUser = leaves.find(leave => leave.userId === l.userId)
      return leaveUser && (l.userId === user.id || leaveUser.userId === user.id)
    })
  } else {
    filteredLeaves = leaves.filter(l => l.userId === user.id)
  }
}
```

**Problems:**
1. **Line 66:** `const leaveUser = leaves.find(leave => leave.userId === l.userId)` - This is redundant, `l` IS already the leave object
2. **Line 67:** `leaveUser.userId === user.id` - This will always be false because it's checking if another user's leave belongs to current user
3. **Team filtering doesn't work** - Leaders can't actually see their team's leaves on calendar

**Expected Behavior:**
- Leaders should see ALL their team members' leaves when `showTeamOnly = true`
- Currently they only see their own leaves

**Impact:**
- ❌ Leaders can't use calendar to coordinate team schedules
- ❌ "Show Team Only" toggle doesn't work for leaders
- ❌ Defeats purpose of team calendar view

---

## 📊 **UPDATE TRIGGER ANALYSIS**

### Current Triggers for `loadLeaves()`
| Trigger | Location | Works for Calendar? |
|---------|----------|---------------------|
| App mount (login) | Line 74 | ✅ Yes |
| Submit new leave | Line 292 | ❌ Only if on form view |
| Approve/Reject leave | Line 673 | ❌ Only if on list view |
| Manual page refresh | Browser | ✅ Yes |
| Switch views | None | ❌ No |
| Other user actions | None | ❌ No |

---

## 🔧 **RECOMMENDED SOLUTIONS**

### **Solution 1: Add Polling (Quick Fix - Easy)**
Periodically fetch latest data in background

```tsx
// In App.tsx
useEffect(() => {
  if (!token || !user) return
  
  // Poll every 30 seconds
  const interval = setInterval(() => {
    loadLeaves()
  }, 30000)
  
  return () => clearInterval(interval)
}, [token, user])
```

**Pros:**
- ✅ Easy to implement (5 minutes)
- ✅ Works for all users
- ✅ No infrastructure changes

**Cons:**
- ⚠️ Not truly real-time (30s delay)
- ⚠️ Unnecessary API calls
- ⚠️ Doesn't scale well

---

### **Solution 2: Refresh on View Switch (Quick Fix - Easier)**
Reload data when switching to calendar view

```tsx
useEffect(() => {
  if (currentView === 'calendar' && token) {
    loadLeaves()
  }
}, [currentView])
```

**Pros:**
- ✅ Very easy (2 minutes)
- ✅ Ensures fresh data on calendar
- ✅ No extra polling

**Cons:**
- ⚠️ Still not real-time while viewing
- ⚠️ Delay when switching views

---

### **Solution 3: WebSocket/SSE for Real-Time Updates (Best - Complex)**
Push updates from server to all connected clients

**Architecture:**
```
Server Change → Broadcast via WebSocket → All clients update instantly
```

**Pros:**
- ✅ True real-time sync
- ✅ No polling overhead
- ✅ Best UX

**Cons:**
- ⚠️ Requires backend infrastructure
- ⚠️ More complex implementation
- ⚠️ Vercel serverless functions don't support WebSockets well

---

### **Solution 4: Hybrid Approach (Recommended)**
Combine multiple strategies

1. **Immediate refresh on actions** (✅ Already working for list view)
2. **Refresh on view switch** (Quick win)
3. **Light polling** (30-60s intervals)
4. **Manual refresh button** (User control)

---

## 🐛 **BUG FIXES REQUIRED**

### Fix 1: Calendar Filter Logic
```tsx
// In InteractiveCalendar.tsx, replace lines 57-82
if (user.role === 'admin') {
  // Admins see all leaves
  filteredLeaves = leaves
} else if (user.role === 'leader') {
  if (showTeamOnly) {
    // Leaders see their team's leaves
    // NOTE: Leaves don't have teamId, need to filter by userId from team members
    // For now, show all leaves (backend already filters by team)
    filteredLeaves = leaves
  } else {
    // Show only leader's own leaves
    filteredLeaves = leaves.filter(l => l.userId === user.id)
  }
} else {
  // Regular users see only their own leaves
  filteredLeaves = leaves.filter(l => l.userId === user.id)
}
```

### Fix 2: Add View Switch Refresh
```tsx
// In App.tsx, add useEffect
useEffect(() => {
  if (currentView === 'calendar' && token) {
    loadLeaves()
  }
}, [currentView])
```

### Fix 3: Add Manual Refresh Button to Calendar
```tsx
// In InteractiveCalendar.tsx, add refresh button
<button onClick={onRefresh} style={{...}}>
  🔄 Refresh
</button>
```

### Fix 4: Add Polling (Optional)
```tsx
// In App.tsx
useEffect(() => {
  if (!token || !user) return
  
  const interval = setInterval(() => {
    loadLeaves()
  }, 30000) // 30 seconds
  
  return () => clearInterval(interval)
}, [token, user])
```

---

## 📋 **IMPLEMENTATION PRIORITY**

### Phase 1 (Immediate - 10 minutes)
1. ✅ Fix calendar filter logic (5 min)
2. ✅ Add view switch refresh (2 min)
3. ✅ Add manual refresh button (3 min)

### Phase 2 (Quick Win - 5 minutes)
4. ✅ Add polling every 30s (5 min)

### Phase 3 (Future - If needed)
5. ⚠️ Consider WebSocket/SSE for true real-time (Complex)

---

## ✅ **VERIFICATION CHECKLIST**

After implementing fixes, verify:
- [ ] User submits leave → Calendar updates immediately
- [ ] Leader approves leave → Submitter sees update on calendar (within 30s)
- [ ] User switches to calendar view → Data is fresh
- [ ] Manual refresh button works
- [ ] Leaders can see team leaves when "Show Team Only" enabled
- [ ] Multiple users see each other's updates (within 30s)
- [ ] Calendar doesn't flicker or have performance issues

---

## 🎯 **CURRENT STATE SUMMARY**

| Feature | Status | Priority |
|---------|--------|----------|
| Calendar data loads on mount | ✅ Works | - |
| Calendar updates after form submission | ⚠️ Partial (only on list view) | P1 |
| Calendar updates after approval | ❌ Broken | P1 |
| Multi-user real-time sync | ❌ Missing | P1 |
| Team calendar filtering | ❌ Broken | P1 |
| Manual refresh option | ❌ Missing | P2 |
| Polling for updates | ❌ Missing | P2 |

---

**Conclusion:** The calendar is NOT synced across users and does NOT update immediately. It only updates on mount or when manually triggering `loadLeaves()`. Multi-user environments will have significant sync issues.

**End of Report**
