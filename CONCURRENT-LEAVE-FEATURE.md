# Concurrent Leave Limit Feature

## Overview
Added a new team setting that allows leaders to configure the maximum number of team members who can be on leave simultaneously. This helps maintain minimum staffing levels.

## Features

### 1. Team Settings Configuration
Leaders can configure the following settings:
- **Annual Leave Days**: Number of leave days per year
- **Max Consecutive Days**: Maximum consecutive days of leave
- **Min Advance Notice Days**: Minimum days of advance notice required
- **Carry Over Days**: Days that can be carried over to next year
- **Allow Negative Balance**: Whether to allow negative leave balance
- **Max Concurrent Leave**: Maximum number of team members on leave at the same time (NEW)

### 2. Concurrent Leave Warning System
When a leader tries to approve a leave request that would exceed the concurrent leave limit:
- ⚠️ A warning modal appears showing:
  - Current number of team members on leave during that period
  - The configured limit
  - A clear warning message

### 3. Password Override for Emergency Approvals
For emergency situations, leaders can override the concurrent leave limit by:
1. Entering their password in the warning modal
2. System verifies the password
3. If valid, the leave is approved with logging of the override
4. If invalid, an error message is shown

### 4. Working Days Calculation
✓ **Verified**: Only working days are counted towards leave balance
- Uses `calculateWorkingDays()` function that respects shift patterns
- Supports:
  - Regular patterns (Mon-Fri)
  - Rotation patterns (2-2, 3-3, 4-4, 5-5)
  - Custom patterns (e.g., "WWWOO" = 3 work, 2 off)
- Weekends and non-working days are automatically excluded
- Balance calculations use `workingDaysCount` field from approved leaves

## Implementation Details

### Backend Changes

#### `/api/teams.js`
- Added extraction and validation for new settings fields:
  - `maxConsecutiveDays` (1-365 days)
  - `minAdvanceNoticeDays` (0-365 days)
  - `carryOverDays` (0-365 days)
  - `allowNegativeBalance` (boolean)
  - `maxConcurrentLeave` (1-50 people)
- Updated settings merge logic to store all new fields
- Set sensible defaults for each field

#### `/lib/shared/working-days.js`
- Updated `getDefaultTeamSettings()` to include all new fields with defaults:
  - `maxConsecutiveDays: 14`
  - `minAdvanceNoticeDays: 7`
  - `carryOverDays: 5`
  - `allowNegativeBalance: false`
  - `maxConcurrentLeave: 3`

#### `/api/leaves/[id].js`
- Added concurrent leave limit checking before approval
- Counts overlapping approved leaves for the same team
- Returns 409 status with warning if limit would be exceeded
- Accepts `overridePassword` parameter for emergency overrides
- Verifies password using bcrypt before allowing override
- Logs all override attempts for audit trail

### Frontend Changes

#### `src/components/TeamLeaveSettings.tsx`
- Added UI field for "Maximum Concurrent Leave"
- Number input with range 1-50
- Clear description: "Maximum number of team members who can be on leave at the same time"
- Positioned between "Carry Over Days" and "Allow Negative Balance"

#### `src/components/Dashboard.tsx`
- Added state for password override modal
- Updated `handleLeaveAction()` to handle 409 concurrent limit errors
- Added password override modal with:
  - Warning message display
  - Current count vs limit display
  - Password input field
  - Cancel and Override buttons
  - Error handling for invalid passwords
- Modal styling matches application theme

## Security Features

1. **Password Verification**: Leaders must re-enter their password to override limits
2. **Audit Logging**: All override attempts are logged with:
   - Leave ID
   - Team ID
   - User who performed override
   - Current count and limit values
   - Timestamp
3. **Invalid Password Protection**: Failed password attempts are logged and blocked

## User Experience

### Normal Approval (Within Limit)
1. Leader clicks "Approve" button
2. Leave is immediately approved
3. Dashboard updates automatically

### Approval Exceeding Limit
1. Leader clicks "Approve" button
2. Warning modal appears with detailed information
3. Leader can either:
   - **Cancel**: Close modal, leave remains pending
   - **Override**: Enter password and approve anyway

### Emergency Override Flow
1. Leader reads warning about staffing levels
2. Enters their password in the modal
3. Clicks "Override & Approve"
4. System verifies password
5. If valid: Leave approved, modal closes, dashboard updates
6. If invalid: Error message shown, can try again

## Testing Checklist

- [ ] Leaders can update max concurrent leave setting
- [ ] Settings persist after save
- [ ] Warning appears when limit would be exceeded
- [ ] Password override works with valid password
- [ ] Invalid password shows error message
- [ ] Override is logged in system logs
- [ ] Working days calculation excludes weekends
- [ ] Custom shift patterns work correctly
- [ ] Balance calculations use only working days
- [ ] Modal closes after successful override
- [ ] Cancel button works properly

## Configuration Recommendations

- **Small teams (3-5 people)**: Set limit to 1-2
- **Medium teams (6-10 people)**: Set limit to 2-3
- **Large teams (11+ people)**: Set limit to 3-5
- **Critical operations**: Lower limit for minimum coverage
- **Flexible environments**: Higher limit for more freedom

## Future Enhancements

- Dashboard display showing current concurrent leave count
- Email notification to admin when limit is overridden
- Different limits for different leave types (e.g., sick leave exempt)
- Per-shift concurrent leave limits for shift-based teams
- Calendar view highlighting when at/near limit
