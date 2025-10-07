# Leader Permissions & Settings Audit Report
**Date:** October 7, 2025
**Status:** ⚠️ Issues Found

---

## 📋 **LEADER PERMISSIONS ANALYSIS**

### ✅ **WORKING CORRECTLY**

#### 1. **Leave Management** ✅
- **API:** `api/leaves.js` line 283
- **Status:** Leaders CAN approve/reject leaves ✅
- **Code:** `if (auth.user.role !== 'admin' && auth.user.role !== 'leader')`

#### 2. **View Team Leaves** ✅  
- **API:** `api/shared/mongodb-storage.js` lines 213-227
- **Status:** Leaders see only their team's leaves ✅
- **Fallback:** If no team, shows their own leaves ✅

#### 3. **List Users** ✅
- **API:** `api/users.js` lines 104-122
- **Status:** Leaders can list users (admins filtered out) ✅
- **Code:** `if (decoded.role === 'leader') { users = users.filter(u => u.role !== 'admin'); }`

#### 4. **Create Users** ✅
- **API:** `api/users.js` lines 130-208
- **Status:** Leaders CAN create users ✅
- **Restriction:** Cannot create admins ✅
- **Code:** `if (decoded.role === 'leader' && role === 'admin') { return 403; }`

#### 5. **Update Users** ✅
- **API:** `api/users.js` lines 280-365
- **Status:** Leaders CAN update users ✅
- **Restriction:** Cannot set admin role ✅

#### 6. **Assign/Remove Users from Teams** ✅
- **API:** `api/teams.js` lines 471-537 (assign), 541-607 (remove)
- **Status:** Leaders CAN manage their own team members ✅
- **Restriction:** Only their own team ✅

#### 7. **View Team Settings** ✅
- **API:** `api/teams.js` lines 610-666
- **Status:** Leaders CAN view their team settings ✅

#### 8. **Update Team Settings** ✅
- **API:** `api/teams.js` lines 669-764
- **Status:** Leaders CAN update their team settings ✅

---

## ❌ **ISSUES FOUND**

### 🔴 **CRITICAL ISSUE 1: Leaders CANNOT Delete Users**
**Location:** `api/users.js` lines 370-381

**Current Code:**
```javascript
// Only admins can delete users
if (decoded.role !== 'admin') {
  return res.status(403).json({ success: false, error: 'Only admins can delete users' });
}
```

**Problem:** Leaders cannot remove users from the system, only unassign them from teams.

**Impact:** 
- Leaders cannot clean up inactive team members
- Have to ask admin to delete users
- Reduces leader autonomy

**Recommendation:** Allow leaders to delete users from their team (but not admins/other leaders)

---

### 🔴 **CRITICAL ISSUE 2: Leaders CANNOT Change User Passwords**
**Location:** `api/users.js` lines 223-225

**Current Code:**
```javascript
// Only admins can change user passwords
if (decoded.role !== 'admin') {
  return res.status(403).json({ success: false, error: 'Only admins can change user passwords' });
}
```

**Problem:** When team members forget passwords, leaders cannot help them.

**Impact:**
- Leaders cannot reset passwords for their team
- Increases admin workload
- Poor user experience for team members

**Recommendation:** Allow leaders to change passwords for users in their team only

---

### 🟡 **ISSUE 3: Team Settings NOT Applied When User Registers**
**Location:** `api/register.js` lines 70-74

**Current Code:**
```javascript
// Add teamId if provided
if (teamId) {
  const { ObjectId } = await import('mongodb');
  userData.teamId = new ObjectId(teamId);
}
```

**Problem:** When a user registers with a team, they don't automatically get team default settings.

**Expected Behavior:**
1. User registers → assigned to team
2. Team has default settings (shift pattern, working days, etc.)
3. User should inherit these defaults automatically

**Current Behavior:**
- User gets teamId but NO settings
- Have to manually set settings later
- Inconsistent experience

**Fix Required:**
```javascript
if (teamId) {
  userData.teamId = new ObjectId(teamId);
  
  // Get team and apply default settings
  const team = await db.collection('teams').findOne({ _id: userData.teamId });
  if (team?.settings?.defaults) {
    userData.settings = team.settings.defaults;
  }
}
```

---

### 🟡 **ISSUE 4: Team Settings NOT Applied When User Assigned to Team**
**Location:** `api/teams.js` lines 516-519

**Current Code:**
```javascript
// Assign user to team
await usersCollection.updateOne(
  { _id: new ObjectId(userId) },
  { $set: { teamId: new ObjectId(teamId) } }
);
```

**Problem:** When admin/leader assigns a user to a team, they don't get team default settings.

**Expected Behavior:**
1. User assigned to team
2. If user has NO personal settings
3. Inherit team default settings automatically

**Current Behavior:**
- User gets teamId only
- Settings remain empty or system defaults
- Team policies don't apply

**Fix Required:**
```javascript
// Assign user to team
const updateData = { teamId: new ObjectId(teamId) };

// If user has no settings, apply team defaults
if (!user.settings || Object.keys(user.settings).length === 0) {
  if (team.settings?.defaults) {
    updateData.settings = team.settings.defaults;
  }
}

await usersCollection.updateOne(
  { _id: new ObjectId(userId) },
  { $set: updateData }
);
```

---

### 🟡 **ISSUE 5: User Creation Doesn't Apply Team Defaults**
**Location:** `api/users.js` lines 183-189 (handleCreateUser)

**Current Code:**
```javascript
const result = await usersCollection.insertOne({
  username: usernameValidation.value,
  passwordHash,
  name: nameValidation.value,
  role: roleValidation.value,
  createdAt: new Date()
});
```

**Problem:** When creating a user (even if they'll be assigned to a team later), no settings applied.

**Note:** This is less critical since users are assigned to teams separately, but should be addressed when handling the team assignment.

---

## 📊 **SUMMARY**

### Permission Matrix
| Action | Admin | Leader | User |
|--------|-------|--------|------|
| View Leaves | All | Team only ✅ | Own only ✅ |
| Approve Leaves | ✅ | ✅ | ❌ |
| Create Users | ✅ | ✅ (no admins) | ❌ |
| Update Users | ✅ | ✅ (no admins) | ❌ |
| Delete Users | ✅ | ❌ **MISSING** | ❌ |
| Change Passwords | ✅ | ❌ **MISSING** | ❌ |
| Manage Team | ✅ | Own team ✅ | ❌ |
| Request Leave | ❌ | ❌ | ✅ |

### Settings Propagation Issues
| Scenario | Current Behavior | Expected Behavior |
|----------|------------------|-------------------|
| User registers with teamId | Gets teamId only | Gets teamId + team defaults ❌ |
| User assigned to team | Gets teamId only | Gets teamId + team defaults ❌ |
| User updates own settings | Works ✅ | Works ✅ |
| Team updates defaults | Works ✅ | Should update users without custom settings ❌ |

---

## 🔧 **RECOMMENDED FIXES**

### Priority 1 (Critical - Leader Autonomy)
1. ✅ Allow leaders to delete users from their team
2. ✅ Allow leaders to change passwords for their team members

### Priority 2 (Settings Propagation)
3. ✅ Apply team defaults when user registers with teamId
4. ✅ Apply team defaults when user assigned to team
5. ⚠️ Consider: When team defaults change, update users without custom settings (complex)

---

## 🎯 **IMPLEMENTATION PLAN**

### Fix 1: Leader Can Delete Team Users
```javascript
// In api/users.js handleDeleteUser
if (decoded.role === 'leader') {
  // Leaders can only delete users in their team
  const team = await teamsCollection.findOne({ leaderId: new ObjectId(decoded.id) });
  if (!team || user.teamId?.toString() !== team._id.toString()) {
    return res.status(403).json({ error: 'Can only delete users in your team' });
  }
  
  // Cannot delete admins or other leaders
  if (user.role === 'admin' || user.role === 'leader') {
    return res.status(403).json({ error: 'Cannot delete admins or leaders' });
  }
}
```

### Fix 2: Leader Can Change Team User Passwords
```javascript
// In api/users.js handlePasswordChange
if (decoded.role === 'leader') {
  // Leaders can only change passwords for users in their team
  const team = await teamsCollection.findOne({ leaderId: new ObjectId(decoded.id) });
  if (!team || user.teamId?.toString() !== team._id.toString()) {
    return res.status(403).json({ error: 'Can only change passwords for users in your team' });
  }
  
  // Cannot change admin or leader passwords
  if (user.role === 'admin' || user.role === 'leader') {
    return res.status(403).json({ error: 'Cannot change admin or leader passwords' });
  }
}
```

### Fix 3 & 4: Apply Team Defaults
```javascript
// Reusable helper function
async function applyTeamDefaultSettings(db, userId, teamId) {
  const usersCollection = db.collection('users');
  const teamsCollection = db.collection('teams');
  
  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
  const team = await teamsCollection.findOne({ _id: new ObjectId(teamId) });
  
  // Only apply if user has no custom settings
  if ((!user.settings || Object.keys(user.settings).length === 0) && team?.settings?.defaults) {
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { settings: team.settings.defaults } }
    );
  }
}
```

---

## ✅ **VERIFICATION CHECKLIST**

After implementing fixes, verify:
- [ ] Leader can delete team users (but not admins/leaders)
- [ ] Leader can change team user passwords (but not admins/leaders)
- [ ] User registering with teamId gets team defaults
- [ ] User assigned to team gets team defaults (if no custom settings)
- [ ] User with custom settings keeps them when assigned to team
- [ ] Leaders still cannot manage users outside their team
- [ ] Leaders still cannot create/modify admins

---

**End of Report**
