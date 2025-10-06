# Settings Architecture

## User-Level Settings (Individual Preferences)
Each user has their own work schedule configured in their profile:

### User Settings Schema
```javascript
user.settings = {
  shiftPattern: {
    type: 'regular' | '2-2' | '5-2' | 'custom',
    customPattern: '3-2', // For custom patterns
    referenceDate: '2025-01-01' // Cycle start date
  },
  shiftTime: {
    type: 'day' | 'night' | 'custom',
    customStart: '08:00', // For custom hours
    customEnd: '17:00'
  },
  workingDays: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false
  }
}
```

**Why User-Level?**
- Different team members work different shifts
- Nurse A: 2/2 day shift
- Nurse B: 2/2 night shift
- Manager: Regular Mon-Fri

## Team-Level Settings (Organization-Wide Policies)
Team settings control policies that apply to everyone:

### Team Settings Schema
```javascript
team.settings = {
  annualLeaveDays: 21, // Days per year (company policy)
  concurrentLeave: {
    enabled: true,
    maxPerTeam: 3, // Max people on leave simultaneously
    maxPerShift: 2, // Max per shift (day/night)
    checkByShift: true
  },
  defaults: { // Default settings for new team members
    shiftPattern: { type: 'regular' },
    shiftTime: { type: 'day' },
    workingDays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false }
  }
}
```

**Why Team-Level?**
- Annual leave is a company/HR policy
- Concurrent limits affect team operations
- Ensures minimum staffing levels

## Implementation Plan

1. **Backend: Add user settings endpoints**
   - GET /api/users?id={userId}&action=settings
   - PUT /api/users?id={userId}&action=settings

2. **Backend: Update working days calculator**
   - Fetch user settings instead of team settings
   - Fallback to team defaults if user settings not configured

3. **Backend: Simplify team settings**
   - Remove shift-specific fields
   - Keep only annualLeaveDays, concurrentLeave, and defaults

4. **Frontend: Create user profile settings modal**
   - Allow users to configure their own shifts
   - Accessible from profile menu

5. **Frontend: Simplify team settings modal**
   - Remove shift pattern, shift time, working days tabs
   - Keep only concurrent limits and annual leave

## Migration Strategy
- Existing team settings remain unchanged
- Users without settings inherit from team defaults
- Gradual migration as users update their profiles
