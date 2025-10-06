# Annual Leave Days Per Team - Implementation Summary

## ✅ Feature Complete

### Overview
Each team can now have a **customizable annual leave allowance** (1-365 days per year). This is integrated throughout the system:

## Implementation Details

### 1. Team Settings Storage
Located in `teams` collection, `settings.annualLeaveDays` field:

```javascript
{
  _id: ObjectId("..."),
  name: "Engineering Team",
  settings: {
    annualLeaveDays: 25,  // ← Customizable per team
    shiftPattern: { ... },
    // ... other settings
  }
}
```

### 2. API Endpoints

#### Get Team Settings
```http
GET /api/teams?id={teamId}&action=settings
Authorization: Bearer {token}

Response:
{
  "settings": {
    "annualLeaveDays": 25,
    "shiftPattern": { ... },
    ...
  }
}
```

#### Update Annual Leave Days
```http
PUT /api/teams?id={teamId}&action=settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "annualLeaveDays": 25
}

Response:
{
  "message": "Team settings updated successfully",
  "settings": { ... }
}
```

**Validation:**
- Must be a number between 1 and 365
- Only admins and team leaders (own team) can modify

### 3. Balance Integration

**File:** `api/balance.js`

When fetching a user's balance, the system:
1. Finds the user's team
2. Reads `annualLeaveDays` from team settings
3. Uses that value for `totalDays` in balance
4. Auto-syncs if team settings change

**Code Flow:**
```javascript
// Get user's team
const user = await db.collection('users').findOne({ _id: userId });
let annualLeaveDays = 21; // System default

if (user?.teamId) {
  const team = await db.collection('teams').findOne({ _id: user.teamId });
  if (team?.settings?.annualLeaveDays) {
    annualLeaveDays = team.settings.annualLeaveDays;
  }
}

// Use in balance calculation
const balance = {
  totalDays: annualLeaveDays,
  usedDays: 5,
  pendingDays: 2,
  availableDays: annualLeaveDays - 5 - 2  // 14 days available
};
```

### 4. Default Values

| Context | Default Value |
|---------|--------------|
| New teams | 21 days/year |
| Users without teams | 21 days/year |
| Minimum allowed | 1 day/year |
| Maximum allowed | 365 days/year |

## Use Cases

### Example 1: Different Team Allowances
```
Office Team:         21 days/year (standard)
Manufacturing Team:  15 days/year (shift work)
Management Team:     30 days/year (senior staff)
Sales Team:          25 days/year (field work)
```

### Example 2: Country-Specific Requirements
```
UK Team:       28 days/year (UK statutory minimum)
US Team:       15 days/year (US average)
EU Team:       25 days/year (EU directive)
```

### Example 3: Seniority-Based
```
Junior Team:    15 days/year (0-2 years)
Mid Team:       21 days/year (2-5 years)
Senior Team:    25 days/year (5+ years)
```

## Automatic Balance Updates

**Smart Sync Feature:**
When a team's `annualLeaveDays` changes from 21 to 25:

1. User's next balance fetch detects the change
2. Balance `totalDays` automatically updates to 25
3. Database record syncs: `{ $set: { totalDays: 25 } }`
4. User immediately sees new allowance

**Example:**
```
Before: 21 total - 5 used - 2 pending = 14 available
After:  25 total - 5 used - 2 pending = 18 available (+4 days)
```

## Authorization

### Who Can Modify?
- ✅ **Admins**: Can modify any team's annual leave days
- ✅ **Team Leaders**: Can modify only their own team's settings
- ❌ **Regular Users**: Cannot modify (read-only)

### Audit Logging
Every change is logged:
```javascript
{
  action: 'Team settings updated',
  teamId: '...',
  updatedBy: 'admin_user_id',
  fields: ['annualLeaveDays'],
  oldValue: 21,
  newValue: 25,
  timestamp: '2025-10-06T...'
}
```

## Frontend Integration (Next Phase)

In the Team Settings UI, add an input field:

```tsx
<div>
  <label>Annual Leave Days per Year</label>
  <input 
    type="number" 
    min="1" 
    max="365" 
    value={settings.annualLeaveDays}
    onChange={e => setAnnualLeaveDays(e.target.value)}
  />
  <span className="help-text">
    How many days of leave each team member gets per year (1-365)
  </span>
</div>
```

## Testing

### Manual Test Steps

1. **Create Team with Custom Days:**
```bash
curl -X POST "https://your-app.vercel.app/api/teams" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Team",
    "description": "Senior staff with extra leave"
  }'

# Update settings
curl -X PUT "https://your-app.vercel.app/api/teams?id=TEAM_ID&action=settings" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"annualLeaveDays": 30}'
```

2. **Verify Balance:**
```bash
# Get user balance (should show 30 total days)
curl -X GET "https://your-app.vercel.app/api/balance?userId=USER_ID&year=2025" \
  -H "Authorization: Bearer $USER_TOKEN"

# Response should show:
{
  "balance": {
    "totalDays": 30,  # ← From team settings
    "usedDays": 0,
    "pendingDays": 0,
    "availableDays": 30
  }
}
```

3. **Change Team Settings:**
```bash
# Update to 25 days
curl -X PUT "https://your-app.vercel.app/api/teams?id=TEAM_ID&action=settings" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"annualLeaveDays": 25}'

# Fetch balance again - should auto-update to 25
curl -X GET "https://your-app.vercel.app/api/balance?userId=USER_ID&year=2025" \
  -H "Authorization: Bearer $USER_TOKEN"
```

## Benefits

1. **Flexibility**: Each team can have appropriate allowances
2. **Compliance**: Meet different legal requirements per region
3. **Fairness**: Recognize seniority or role differences
4. **Automatic**: No manual balance adjustments needed
5. **Transparent**: Users always see current allowance

## Database Schema

### Teams Collection
```javascript
{
  _id: ObjectId,
  name: string,
  leaderId: ObjectId,
  settings: {
    annualLeaveDays: number,  // 1-365
    shiftPattern: { ... },
    concurrentLeave: { ... },
    // ... other settings
    updatedAt: Date,
    updatedBy: ObjectId
  }
}
```

### Balances Collection (Auto-synced)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  year: number,
  totalDays: number,      // ← Synced from team.settings.annualLeaveDays
  usedDays: number,
  pendingDays: number,
  availableDays: number,  // Calculated: totalDays - usedDays - pendingDays
  updatedAt: Date
}
```

## Migration Path

**No migration needed!** 

- Existing teams without settings: Use default (21 days)
- Existing balances: Auto-sync on next fetch
- Backwards compatible: Everything works as before

## Summary

✅ **Backend Complete** - Annual leave days per team fully implemented
✅ **Balance Integration** - Auto-syncs with team settings  
✅ **Validation** - 1-365 days with proper error handling
✅ **Authorization** - Admin and team leader access control
✅ **Audit Logging** - All changes tracked
✅ **Default Values** - Sensible defaults (21 days)
✅ **Auto-Sync** - Balance updates when settings change
✅ **Backwards Compatible** - Existing data works seamlessly

🚀 **Ready for Production** - Deploy anytime!
