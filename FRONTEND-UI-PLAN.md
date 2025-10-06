# Frontend UI Implementation Plan

## 🎯 Overview
Complete the team settings feature by building the user interface and integrating working days calculations into the leave management flow.

---

## 📋 Task 1: Team Settings UI Component

### What's Needed
A comprehensive settings modal accessible from the Team Management page that allows admins and team leaders to configure their team's leave policies.

### Components to Build

#### 1.1 TeamSettingsModal Component
**Location:** `src/components/TeamSettingsModal.tsx`

**Features:**
- Modal dialog with tabs for different setting categories
- Form validation and error handling
- Real-time preview of settings impact
- Save/Cancel actions with confirmation

**Tabs:**
1. **Shift Pattern Tab**
   - Radio buttons: Regular (Mon-Fri), 2/2, 5/2, Custom
   - For custom: Input fields for work days & off days
   - Date picker for pattern start date
   - Preview: "Your team works 2 days, then has 2 days off"

2. **Shift Time Tab**
   - Radio buttons: Day Shift, Night Shift, Custom
   - For custom: Time pickers (start & end)
   - Preview: "Shift runs from 08:00 to 17:00"

3. **Working Days Tab**
   - Checkbox: Exclude weekends
   - Multi-select: Custom off days (Sun, Mon, Tue, etc.)
   - Checkbox: Count only working days for leave
   - Info text explaining impact

4. **Leave Limits Tab**
   - Toggle: Enable concurrent leave limits
   - Number input: Max per shift (if enabled)
   - Number input: Max per team (if enabled)
   - Checkbox: Check by shift pattern
   - Warning: "Prevents understaffing"

5. **Annual Leave Tab**
   - Number input: Days per year (1-365)
   - Default: 21 days
   - Info: "How many days each team member gets annually"

**UI Mockup:**
```
┌─────────────────────────────────────────────┐
│  ⚙️ Team Settings - Engineering Team        │
├─────────────────────────────────────────────┤
│  [Shift Pattern] [Shift Time] [Working Days]│
│  [Leave Limits] [Annual Leave]              │
├─────────────────────────────────────────────┤
│                                             │
│  Shift Pattern                              │
│  ○ Regular (Monday-Friday)                  │
│  ● 2/2 (2 days on, 2 days off)             │
│  ○ 5/2 (5 days on, 2 days off)             │
│  ○ Custom                                   │
│                                             │
│  Pattern Start Date: [Oct 1, 2025]         │
│                                             │
│  📊 Preview:                                │
│  Your team works 2 days, off 2 days        │
│                                             │
├─────────────────────────────────────────────┤
│           [Cancel]  [Save Settings]         │
└─────────────────────────────────────────────┘
```

#### 1.2 Update TeamManagement Component
**Location:** `src/components/TeamManagement.tsx`

**Changes:**
- Add "⚙️ Settings" button next to each team
- Click opens TeamSettingsModal
- Pass team ID and current settings
- Refresh team list after settings saved

**Code Addition:**
```tsx
<button 
  onClick={() => openTeamSettings(team._id)}
  style={{ marginLeft: '10px' }}
>
  ⚙️ Settings
</button>
```

---

## 📋 Task 2: Leave Request Validation Logic

### What's Needed
Real-time calculation of working days when users request leave, showing both working days and calendar days.

### Components to Update

#### 2.1 Leave Request Form (in App.tsx)
**Location:** Lines 400-470 in `src/App.tsx`

**Changes:**
1. **Add Working Days Calculator**
   - Fetch user's team settings on form load
   - Calculate working days as user selects dates
   - Display: "5 working days (10 calendar days)"
   - Warning if concurrent limit exceeded

2. **Real-time Calculation:**
```tsx
const [workingDaysCount, setWorkingDaysCount] = useState(0);
const [calendarDaysCount, setCalendarDaysCount] = useState(0);
const [concurrentWarning, setConcurrentWarning] = useState('');

useEffect(() => {
  if (startDate && endDate) {
    calculateWorkingDays(startDate, endDate);
  }
}, [startDate, endDate]);

async function calculateWorkingDays(start, end) {
  const res = await fetch('/api/leaves/calculate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ startDate: start, endDate: end })
  });
  
  const data = await res.json();
  setWorkingDaysCount(data.workingDays);
  setCalendarDaysCount(data.calendarDays);
  setConcurrentWarning(data.warning || '');
}
```

3. **Display Update:**
```tsx
<div style={{ 
  marginTop: '10px', 
  padding: '10px', 
  background: '#f0f9ff',
  borderRadius: '5px' 
}}>
  <strong>📊 Duration:</strong>
  <div style={{ marginTop: '5px' }}>
    <span style={{ fontSize: '18px', color: '#0369a1' }}>
      {workingDaysCount} working days
    </span>
    <span style={{ color: '#64748b', marginLeft: '10px' }}>
      ({calendarDaysCount} calendar days)
    </span>
  </div>
  
  {concurrentWarning && (
    <div style={{ 
      marginTop: '8px', 
      padding: '8px',
      background: '#fef3c7',
      color: '#92400e',
      borderRadius: '4px'
    }}>
      ⚠️ {concurrentWarning}
    </div>
  )}
</div>
```

#### 2.2 Backend Endpoint (New)
**Location:** `api/leaves.js` or new `api/leaves/calculate.js`

**Purpose:** Calculate working days without creating leave request

```javascript
// POST /api/leaves/calculate
// Body: { startDate, endDate }
// Response: { workingDays, calendarDays, warning }
```

---

## 📋 Task 3: Concurrent Leave Conflict Checking

### What's Needed
Before approving leave, check if it would exceed team's concurrent leave limit and show warning to approver.

### Components to Update

#### 3.1 LeaveCard Component (in App.tsx)
**Location:** Lines 539-650 in `src/App.tsx`

**Changes:**
1. **Add Conflict Check on Approve:**
```tsx
async function checkAndApprove() {
  // First check for conflicts
  const checkRes = await fetch(`/api/leaves/check-conflicts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      leaveId: leave._id,
      startDate: leave.startDate,
      endDate: leave.endDate
    })
  });
  
  const { hasConflict, count, limit, message } = await checkRes.json();
  
  if (hasConflict) {
    const confirmed = confirm(
      `⚠️ Warning: ${message}\n\n` +
      `Currently ${count} people on leave (limit: ${limit})\n\n` +
      `Approve anyway?`
    );
    
    if (!confirmed) return;
  }
  
  // Proceed with approval
  updateStatus('approved');
}
```

2. **Display Conflict Indicator:**
```tsx
{isAdmin && leave.status === 'pending' && (
  <div>
    {leave.conflictWarning && (
      <div style={{
        padding: '8px',
        background: '#fef3c7',
        color: '#92400e',
        borderRadius: '4px',
        marginBottom: '10px',
        fontSize: '13px'
      }}>
        ⚠️ {leave.conflictWarning}
      </div>
    )}
    
    <div style={{ display: 'flex', gap: '10px' }}>
      <button onClick={checkAndApprove}>✓ Approve</button>
      <button onClick={() => updateStatus('rejected')}>✗ Reject</button>
    </div>
  </div>
)}
```

#### 3.2 Backend Endpoint (New)
**Location:** New file `api/leaves/check-conflicts.js`

**Purpose:** Check if approving would exceed concurrent leave limit

```javascript
// POST /api/leaves/check-conflicts
// Body: { leaveId, startDate, endDate }
// Response: { 
//   hasConflict: boolean,
//   count: number,
//   limit: number,
//   message: string
// }
```

---

## 📋 Task 4: Update Leave Display to Show Working Days

### What's Needed
Show actual working days (not calendar days) throughout the app - in cards, lists, calendar, and dashboard.

### Components to Update

#### 4.1 LeaveCard Component
**Location:** `src/App.tsx` lines 539-650

**Changes:**
```tsx
// Add working days display
<div style={{ marginBottom: '10px' }}>
  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>
      {leave.workingDaysCount || '—'} working days
    </span>
    <span style={{ fontSize: '13px', color: '#6b7280' }}>
      ({leave.calendarDaysCount || calculateDays(leave.startDate, leave.endDate)} calendar days)
    </span>
  </div>
  
  {leave.shiftPattern && (
    <span style={{
      display: 'inline-block',
      marginTop: '4px',
      padding: '2px 8px',
      background: '#dbeafe',
      color: '#1e40af',
      borderRadius: '12px',
      fontSize: '11px'
    }}>
      {leave.shiftPattern === 'regular' ? '📅 Regular' : 
       leave.shiftPattern === '2-2' ? '🔄 2/2 Shift' :
       leave.shiftPattern === '5-2' ? '🔄 5/2 Shift' : '🔄 Custom'}
    </span>
  )}
</div>
```

#### 4.2 Dashboard Component
**Location:** `src/components/Dashboard.tsx`

**Changes:**
- Update stats to show working days used
- Display "12 working days used (15 calendar days)"
- Update upcoming leaves to show working days

```tsx
// In stats section
<div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
  {stats.workingDaysUsed} working days
  <span style={{ marginLeft: '4px' }}>
    ({stats.calendarDaysUsed} calendar)
  </span>
</div>
```

#### 4.3 InteractiveCalendar Component
**Location:** `src/components/InteractiveCalendar.tsx`

**Changes:**
- Highlight only working days in different color
- Show "Working day" vs "Off day" in tooltip
- Display working days count in event

```tsx
// Event rendering
title: `${leave.employeeName} - ${leave.workingDaysCount} days`,
className: leave.status === 'approved' ? 'approved-leave' : 'pending-leave',
extendedProps: {
  isWorkingDay: true,  // Add flag for working days
  shiftPattern: leave.shiftPattern
}
```

#### 4.4 LeaveBalance Component
**Location:** `src/components/LeaveBalance.tsx`

**Changes:**
- Show working days in balance calculation
- Display "21 total / 5 used (working days)"

```tsx
<div style={{ marginTop: '10px', fontSize: '13px', color: '#6b7280' }}>
  <div>Total: {balance.totalDays} working days/year</div>
  <div>Used: {balance.usedDays} working days</div>
  <div>Available: {balance.availableDays} working days</div>
</div>
```

---

## 🛠️ Implementation Order

**Phase 1: Core Functionality** (Most Important)
1. ✅ Create leave calculation backend endpoint
2. ✅ Update leave request form with working days display
3. ✅ Update leave cards to show working days

**Phase 2: Settings UI** (User-facing)
4. ✅ Build TeamSettingsModal component
5. ✅ Add settings button to TeamManagement
6. ✅ Connect form to backend API

**Phase 3: Conflict Prevention** (Safety)
7. ✅ Create conflict checking endpoint
8. ✅ Add warning on approval
9. ✅ Display conflict indicators

**Phase 4: Polish** (Enhancement)
10. ✅ Update dashboard with working days
11. ✅ Update calendar highlighting
12. ✅ Update balance component

---

## 📦 New Files to Create

1. **`src/components/TeamSettingsModal.tsx`** (350-400 lines)
   - Main settings modal with all tabs
   - Form validation and submission
   - Preview calculations

2. **`api/leaves/calculate.js`** (100 lines)
   - Working days calculation endpoint
   - Concurrent leave checking

3. **`api/leaves/check-conflicts.js`** (100 lines)
   - Conflict detection before approval

---

## 🎨 UI/UX Enhancements

### Color Coding
- **Working days**: Green badge/text (#059669)
- **Calendar days**: Gray text (#6b7280)
- **Warnings**: Yellow background (#fef3c7)
- **Shift badges**: Blue (#dbeafe)

### Icons
- ⚙️ Settings
- 📊 Statistics/Duration
- 🔄 Shift patterns
- ⚠️ Warnings
- ✓ Approve
- ✗ Reject

### Responsive Design
- Modal should be scrollable on mobile
- Settings tabs stack vertically on small screens
- Working days display wraps gracefully

---

## 🧪 Testing Checklist

- [ ] Team settings can be opened and saved
- [ ] Working days calculate correctly for regular pattern
- [ ] Working days calculate correctly for 2/2 pattern
- [ ] Working days calculate correctly for 5/2 pattern
- [ ] Concurrent leave limit warning appears
- [ ] Admin can approve despite warning
- [ ] Leave cards show working vs calendar days
- [ ] Dashboard stats use working days
- [ ] Calendar highlights working days only
- [ ] Balance reflects team's annual days setting

---

## 📊 Estimated Effort

| Task | Complexity | Est. Time | Priority |
|------|-----------|-----------|----------|
| Team Settings Modal | High | 3-4 hours | Medium |
| Leave Request Calculator | Medium | 1-2 hours | **High** |
| Conflict Checking | Medium | 1-2 hours | High |
| Display Updates | Low | 1-2 hours | **High** |
| **Total** | | **6-10 hours** | |

---

## 🚀 Quick Start Option

If you want to start with the **highest impact, lowest effort** task:

**Start with Task 4 (Display Updates)**
- Shows immediate value to users
- Relatively simple changes
- No new complex components
- Can be done in 1-2 hours

Then move to:
- Task 2 (Leave calculator)
- Task 1 (Settings modal)
- Task 3 (Conflict checking)

This approach gets visible results fast! 🎉
