# 🧪 Testing Checklist - Phase 1 Refactoring

## Pre-Commit Testing Guide

Before committing the Phase 1 refactoring, please verify all features work correctly in the browser at `http://localhost:5173/`

---

## ✅ Testing Checklist

### 1. Authentication Tests
- [ ] **Login with existing user**
  - Enter username and password
  - Click "Sign In"
  - Verify successful login and redirect to dashboard
  
- [ ] **Login with invalid credentials**
  - Enter wrong username/password
  - Verify error message displays
  
- [ ] **Register new user**
  - Click "Sign Up" tab
  - Enter username (≥3 chars), password (≥8 chars), name
  - Select a team
  - Verify successful registration and login
  
- [ ] **Auto-login on page refresh**
  - Login successfully
  - Refresh the page (Cmd+R)
  - Verify you remain logged in
  
- [ ] **Logout**
  - Click "Logout" button
  - Verify redirect to login screen
  - Refresh page and verify still logged out

---

### 2. Dashboard Tests
- [ ] **Statistics cards display correctly**
  - Total Requests
  - Pending
  - Approved (with working days)
  - Rejected
  - This Month
  
- [ ] **Upcoming leaves section**
  - Shows approved leaves in the future
  - Displays employee name, date, leave type
  - Empty state if no upcoming leaves
  
- [ ] **Recent activity section**
  - Shows recent leave requests
  - Status badges (Pending/Approved/Rejected) colored correctly
  - Admin can see approve/reject buttons for pending leaves
  
- [ ] **Leave balance card (regular users only)**
  - Displays total annual leave days
  - Shows days used
  - Shows days remaining
  - Percentage bar displays correctly

---

### 3. Leave Request Tests
- [ ] **Create new leave request**
  - Navigate to "New Request" tab
  - Select leave type
  - Choose start and end dates
  - Verify working days calculation auto-updates
  - Add reason (optional)
  - Submit request
  - Verify success message
  - Verify redirects to "All Requests"
  
- [ ] **Date validation**
  - Try setting end date before start date
  - Verify error message or prevention
  
- [ ] **Leave type selection**
  - Verify all leave types display with emojis
  - Annual Leave, Sick Leave, Personal Leave, etc.
  
- [ ] **Admin/Leader: Request for team member**
  - Select employee from dropdown
  - Submit request on their behalf
  - Verify request created for that employee

---

### 4. Leave Management Tests (Admin/Leader)
- [ ] **View all leave requests**
  - Navigate to "All Requests" tab
  - Verify all team leave requests display
  
- [ ] **Filter leave requests**
  - Use search box to filter by name
  - Use status dropdown (Pending/Approved/Rejected)
  - Verify results update correctly
  
- [ ] **Approve pending leave**
  - Find a pending leave request
  - Click "Approve" button
  - Verify status updates to "Approved"
  - Verify success toast notification
  
- [ ] **Reject pending leave**
  - Find a pending leave request
  - Click "Reject" button
  - Verify status updates to "Rejected"
  - Verify success toast notification
  
- [ ] **Concurrent leave limit warning**
  - If enabled, approve leave that exceeds team limit
  - Verify password override modal appears
  - Enter password and confirm
  - Verify override works
  
- [ ] **Delete leave request (Admin only)**
  - Click "Delete" button on a leave
  - Confirm deletion
  - Verify leave is removed from list

---

### 5. Calendar View Tests
- [ ] **Navigate to Calendar tab**
  - Click "Calendar" in navigation
  - Verify calendar displays current month
  
- [ ] **View leave events on calendar**
  - Verify approved leaves show as colored events
  - Click on a leave event
  - Verify leave details display
  
- [ ] **Navigate between months**
  - Click "Previous" and "Next" buttons
  - Verify calendar updates correctly
  
- [ ] **Today button**
  - Navigate to different month
  - Click "Today" button
  - Verify returns to current month

---

### 6. User Management Tests (Admin/Leader)
- [ ] **Navigate to Team Members tab**
  - Verify list of users displays
  - Shows role badges (Admin/Leader/User)
  - Shows leave balance
  - Shows joined date
  
- [ ] **Add new user**
  - Click "Add User" button
  - Fill in username, password, name
  - Select role (Leader can only add Users)
  - Select team
  - Submit
  - Verify new user appears in list
  
- [ ] **Edit user details**
  - Click "Edit" on a user card
  - Change name or role
  - Save changes
  - Verify updates reflect in user card
  
- [ ] **Change user password**
  - Click "Change Password" on a user card
  - Enter new password (≥8 chars)
  - Confirm
  - Verify success message
  
- [ ] **Delete user (Admin only)**
  - Click "Delete" on a user card
  - Confirm deletion
  - Verify user removed from list
  
- [ ] **User settings modal**
  - Click "Settings" on a user card
  - Verify shift pattern settings display
  - Verify shift time settings display
  - Verify working days settings display
  - Change settings and save
  - Verify success message

---

### 7. Team Management Tests (Admin)
- [ ] **Navigate to Teams tab**
  - Verify list of teams displays
  - Shows leader name
  - Shows member count
  - Shows creation date
  
- [ ] **Create new team**
  - Click "Create Team" button
  - Enter team name (required)
  - Enter description (optional)
  - Select leader (optional)
  - Submit
  - Verify new team appears in list
  
- [ ] **Edit team**
  - Click "Edit" on a team card
  - Change name, description, or leader
  - Save changes
  - Verify updates reflect in team card
  
- [ ] **View team members**
  - Click "View Members" on a team card
  - Verify list of team members displays
  - Verify member details (name, role, joined date)
  
- [ ] **Assign user to team**
  - In team members modal, click "Assign User"
  - Select user from dropdown
  - Confirm
  - Verify user added to team members list
  
- [ ] **Remove user from team**
  - In team members modal, click "Remove" on a user
  - Confirm removal
  - Verify user removed from team
  
- [ ] **Delete team (Admin only)**
  - Click "Delete" on a team card
  - Confirm deletion
  - Verify team removed from list
  
- [ ] **Team settings modal**
  - Click "Settings" on a team card
  - Verify concurrent leave settings display
  - Verify annual leave days setting
  - Verify default shift patterns
  - Change settings and save
  - Verify success message

---

### 8. Team Settings Tests (Admin)
- [ ] **Navigate to Team Settings tab**
  - Verify team selection dropdown
  - Select a team
  - Verify team settings load
  
- [ ] **Configure concurrent leave limits**
  - Enable/disable concurrent leave checking
  - Set max per team
  - Set max per shift
  - Toggle shift-based checking
  - Save changes
  - Verify success message
  
- [ ] **Set annual leave days**
  - Change annual leave days value
  - Save changes
  - Verify updates reflected

---

### 9. User Profile Settings Tests
- [ ] **Open profile settings**
  - Click "Settings" button in header
  - Verify modal opens
  
- [ ] **Configure shift pattern**
  - Select shift pattern type (Regular/2-2-3/Custom)
  - If custom, enter pattern and reference date
  - Save changes
  - Verify success message
  
- [ ] **Configure shift time**
  - Select shift time (Day/Night/Custom)
  - If custom, enter start and end times
  - Save changes
  - Verify success message
  
- [ ] **Configure working days**
  - Toggle working days checkboxes
  - Save changes
  - Verify success message

---

### 10. Error Handling Tests
- [ ] **Network error handling**
  - Temporarily disconnect internet (if possible)
  - Try to submit a leave request
  - Verify error message displays
  - Reconnect and retry
  
- [ ] **Invalid data handling**
  - Try to submit forms with missing required fields
  - Verify validation messages display
  
- [ ] **Session expiration**
  - If token expires, verify redirect to login
  - Verify proper error message

---

### 11. UI/UX Tests
- [ ] **Navigation between tabs**
  - Click each navigation tab
  - Verify correct view displays
  - Verify active tab is highlighted
  
- [ ] **Toast notifications**
  - Perform actions (create leave, update user, etc.)
  - Verify success toast appears
  - Verify toast auto-dismisses after a few seconds
  - Verify error toasts display correctly
  
- [ ] **Loading states**
  - Watch for loading indicators during data fetch
  - Verify skeleton loaders display (if applicable)
  - Verify loading text shows during operations
  
- [ ] **Empty states**
  - View sections with no data
  - Verify empty state messages display
  - Verify helpful instructions or actions provided
  
- [ ] **Responsive design** (if applicable)
  - Resize browser window
  - Verify layout adjusts appropriately
  - Verify no horizontal scrolling on smaller screens

---

### 12. Console Tests
- [ ] **No JavaScript errors**
  - Open browser console (Cmd+Option+J on Chrome)
  - Navigate through all features
  - Verify no red error messages
  
- [ ] **No TypeScript compilation errors**
  - Check terminal running `npm run dev`
  - Verify no TS errors displayed
  
- [ ] **No infinite loops**
  - Monitor console for repeated log messages
  - Verify app remains responsive

---

## 🐛 Bug Reporting Template

If you find any issues, please document them:

```
**Issue**: [Brief description]
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Behavior**: 
**Actual Behavior**: 
**Component/File**: 
**Error Message** (if any): 
**Console Output**: 
```

---

## ✅ Sign-off

Once all tests pass:
- [ ] All critical features work correctly
- [ ] No console errors
- [ ] No TypeScript compilation errors
- [ ] All user workflows complete successfully
- [ ] Performance is acceptable (no noticeable slowdowns)

**Tested by**: _____________  
**Date**: _____________  
**Browser**: _____________  
**Status**: ⬜ PASS | ⬜ FAIL

---

## 📝 Notes

Add any observations or edge cases discovered during testing:

---

**Ready for commit**: ⬜ YES | ⬜ NO (fix issues first)
