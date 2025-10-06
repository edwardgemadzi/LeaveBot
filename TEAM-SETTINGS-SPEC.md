# Team Settings Feature Specification

## Overview
Enable team-specific leave policies to handle different shift patterns, working days, and concurrent leave limits.

## Data Model

### Team Settings Schema (stored in `teams` collection)
```javascript
{
  _id: ObjectId,
  name: string,
  description: string,
  leaderId: ObjectId,
  
  // NEW: Team-specific leave settings
  settings: {
    // Shift Pattern Configuration
    shiftPattern: {
      type: 'regular' | '2-2' | '5-2' | 'custom',
      // For 'regular': Mon-Fri
      // For '2-2': 2 days on, 2 days off
      // For '5-2': 5 days on, 2 days off
      // For 'custom': define custom pattern
      
      workDays: number,      // Days worked in cycle (e.g., 2, 5)
      offDays: number,       // Days off in cycle (e.g., 2, 2)
      startDate: Date,       // Pattern start reference date
    },
    
    // Shift Time Configuration
    shiftTime: {
      type: 'day' | 'night' | 'custom',
      startTime: string,     // '08:00', '20:00', etc.
      endTime: string,       // '16:00', '04:00', etc.
    },
    
    // Working Days Calculation
    workingDays: {
      excludeWeekends: boolean,      // For regular patterns
      customOffDays: number[],       // [0,6] = Sunday, Saturday
      countOnlyWorkDays: boolean,    // Leave days = working days only
    },
    
    // Concurrent Leave Limits
    concurrentLeave: {
      enabled: boolean,
      maxPerShift: number,           // Max people on leave at same time (same shift)
      maxPerTeam: number,            // Max people on leave (entire team)
      checkByShift: boolean,         // Consider shift patterns for conflicts
    },
    
    // Leave Allowance
    annualLeaveDays: number,         // Default 21 days
    
    // Metadata
    updatedAt: Date,
    updatedBy: ObjectId,
  },
  
  createdAt: Date,
  createdBy: ObjectId
}
```

### User Schema Updates (add shift info)
```javascript
{
  // ... existing fields
  
  // NEW: Individual shift assignment
  shiftInfo: {
    pattern: 'same-as-team' | 'custom',  // Most users follow team pattern
    customPattern: {                      // Only if pattern = 'custom'
      type: '2-2' | '5-2' | 'custom',
      workDays: number,
      offDays: number,
      startDate: Date,
    },
    shiftTime: 'same-as-team' | 'day' | 'night' | 'custom',
    customTime: {
      startTime: string,
      endTime: string,
    }
  }
}
```

### Leave Request Schema Updates
```javascript
{
  // ... existing fields
  
  // NEW: Enhanced leave tracking
  workingDaysCount: number,          // Actual working days affected
  calendarDaysCount: number,         // Total calendar days
  affectedDates: Date[],             // List of working days affected
  shiftPattern: string,              // Snapshot of shift pattern used
  
  // Validation metadata
  validation: {
    checkedConcurrentLimit: boolean,
    concurrentCount: number,         // How many others on leave
    warningIssued: boolean,          // If limit exceeded
  }
}
```

## API Endpoints

### Get Team Settings
```
GET /api/teams?id={teamId}&action=settings
Authorization: Bearer token
Response: {
  settings: { ... },
  team: { name, leaderId, ... }
}
```

### Update Team Settings
```
PUT /api/teams?id={teamId}&action=settings
Authorization: Bearer token (Admin or Team Leader)
Body: {
  shiftPattern: { type, workDays, offDays, startDate },
  shiftTime: { type, startTime, endTime },
  workingDays: { ... },
  concurrentLeave: { ... },
  annualLeaveDays: number
}
Response: {
  message: 'Team settings updated',
  settings: { ... }
}
```

### Validate Leave Request (NEW)
```
POST /api/leaves/validate
Authorization: Bearer token
Body: {
  userId: string,
  startDate: Date,
  endDate: Date
}
Response: {
  valid: boolean,
  workingDaysCount: number,
  affectedDates: Date[],
  conflicts: {
    concurrent: boolean,
    count: number,
    limit: number,
    warning: string
  }
}
```

## Calculation Logic

### Working Days Calculator
```javascript
function calculateWorkingDays(startDate, endDate, shiftPattern, workingDaysConfig) {
  const days = [];
  let current = new Date(startDate);
  
  while (current <= endDate) {
    if (isWorkingDay(current, shiftPattern, workingDaysConfig)) {
      days.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return {
    count: days.length,
    dates: days
  };
}

function isWorkingDay(date, shiftPattern, config) {
  // For regular Mon-Fri
  if (shiftPattern.type === 'regular') {
    const day = date.getDay();
    return day > 0 && day < 6; // Not weekend
  }
  
  // For 2/2 or 5/2 patterns
  const daysSinceStart = Math.floor((date - shiftPattern.startDate) / (1000*60*60*24));
  const cycleLength = shiftPattern.workDays + shiftPattern.offDays;
  const positionInCycle = daysSinceStart % cycleLength;
  
  return positionInCycle < shiftPattern.workDays;
}
```

### Concurrent Leave Checker
```javascript
async function checkConcurrentLeave(userId, startDate, endDate, teamId) {
  const user = await getUserById(userId);
  const team = await getTeamById(teamId);
  const settings = team.settings;
  
  if (!settings.concurrentLeave.enabled) {
    return { valid: true, count: 0 };
  }
  
  // Find overlapping approved leaves
  const overlappingLeaves = await findOverlappingLeaves(
    teamId,
    startDate,
    endDate,
    settings.concurrentLeave.checkByShift ? user.shiftInfo : null
  );
  
  const limit = settings.concurrentLeave.checkByShift 
    ? settings.concurrentLeave.maxPerShift
    : settings.concurrentLeave.maxPerTeam;
  
  return {
    valid: overlappingLeaves.length < limit,
    count: overlappingLeaves.length,
    limit: limit,
    warning: overlappingLeaves.length >= limit 
      ? `Maximum ${limit} people can be on leave at the same time`
      : null
  };
}
```

## UI Components

### Team Settings Modal
- Accessed from Team Management page
- "⚙️ Settings" button next to each team
- Tabs:
  1. **Shift Pattern** - Configure work schedule
  2. **Working Days** - Define what counts as work day
  3. **Leave Limits** - Set concurrent leave restrictions
  4. **Leave Allowance** - Annual days per person

### Leave Request Form Updates
- Show "Calculating working days..." indicator
- Display: "X working days (Y calendar days)"
- Warning badge if concurrent limit reached
- Preview of affected dates

### Leave Card Enhancements
- Badge showing shift type (Day/Night)
- "X working days" prominently displayed
- Conflict indicator if limit exceeded

## Implementation Steps

1. ✅ Update teams collection with default settings
2. ✅ Add GET/PUT endpoints for team settings
3. ✅ Create working days calculator utility
4. ✅ Create concurrent leave checker
5. ✅ Build TeamSettings UI component
6. ✅ Update leave submission flow
7. ✅ Update leave approval checks
8. ✅ Enhance leave display components

## Default Settings
When a team is created without settings:
```javascript
{
  shiftPattern: { type: 'regular', workDays: 5, offDays: 2, startDate: new Date() },
  shiftTime: { type: 'day', startTime: '08:00', endTime: '17:00' },
  workingDays: { excludeWeekends: true, customOffDays: [], countOnlyWorkDays: true },
  concurrentLeave: { enabled: false, maxPerShift: 3, maxPerTeam: 5, checkByShift: false },
  annualLeaveDays: 21
}
```
