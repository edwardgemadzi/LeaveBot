# Supervisor Team Management Guide

## 🎯 Overview

Supervisors can manage their team members directly through Telegram! This guide explains how to add team members, set their schedules, and manage leave requests.

## 👔 Becoming a Supervisor

Only the **admin** (edgemadzi) can promote users to supervisor:

```
/makesupervisor @username
```

**Example:**
```
/makesupervisor @johndoe
```

Once promoted, the user will be able to manage their own team.

## 📋 Supervisor Commands

### 1. View Your Team
```
/team
```

Shows all team members assigned to you with their:
- Name and ID
- Role
- Shift
- Schedule type

**Example output:**
```
👥 Your Team Members:

👤 John Doe (ID: 3)
   Role: team_member
   Shift: day
   Schedule: mon_fri

👤 Jane Smith (ID: 4)
   Role: team_member
   Shift: night
   Schedule: 2_2
```

### 2. Add Team Members
```
/addmember @username
```

**Important:** The person must:
1. Have a Telegram username
2. Have started the bot (sent `/start`)

**Example:**
```
/addmember @newemployee
```

**What happens:**
- User is added to your team
- You become their supervisor
- They can now book leave
- You'll see a confirmation with their employee ID

### 3. Set Member Schedule
```
/setschedule <employee_id> <shift> <schedule_type>
```

**Shifts:**
- `day` - Day shift (e.g., 9am-5pm)
- `night` - Night shift (e.g., 10pm-6am)
- `evening` - Evening shift (e.g., 2pm-10pm)
- `rotating` - Rotating shifts

**Schedule Types:**
- `mon_fri` - Monday to Friday (5-day week)
- `2_2` - 2 days on, 2 days off
- `3_3` - 3 days on, 3 days off
- `4_4` - 4 days on, 4 days off

**Examples:**
```
# Set employee #3 to night shift with 2/2 schedule
/setschedule 3 night 2_2

# Set employee #4 to day shift with Mon-Fri schedule
/setschedule 4 day mon_fri

# Set employee #5 to evening shift with 3/3 schedule
/setschedule 5 evening 3_3
```

### 4. Book Emergency Leave (Supervisor/Admin Only)
```
/book 2025-10-10 2025-10-12 Emergency --emergency
```

The `--emergency` flag bypasses the 14-day advance booking rule.

## 🔄 Complete Workflow Example

### Scenario: Adding a new night shift employee with 2/2 schedule

**Step 1:** Have the employee start the bot
```
Employee sends: /start
```

**Step 2:** Add them to your team
```
You send: /addmember @newemployee
Bot responds: ✅ Added John Doe (@newemployee) to your team!
              Employee ID: 5
```

**Step 3:** Set their schedule
```
You send: /setschedule 5 night 2_2
Bot responds: ✅ Schedule updated!
              Employee ID: 5
              Shift: night
              Schedule: 2_2
              Start Date: 2025-10-04
```

**Step 4:** Employee can now book leave
```
Employee sends: /book 2025-10-20 2025-10-22 Vacation
```

## 📊 Team Management Best Practices

### 1. Shift Isolation
- **Day shift** and **night shift** limits are separate
- Each shift can have up to 2 members on leave per day
- Configure shifts correctly to ensure proper coverage

### 2. Schedule Types

**Mon-Fri (5-day week):**
- Best for: Office workers, regular business hours
- Work days: Monday through Friday
- Off days: Saturday and Sunday

**2/2 Schedule:**
- Best for: Security, manufacturing, 24/7 operations
- Pattern: 2 days on, 2 days off
- Continuous rotation

**3/3 Schedule:**
- Best for: Healthcare, customer support
- Pattern: 3 days on, 3 days off
- More consecutive rest days

**4/4 Schedule:**
- Best for: Remote operations, offshore work
- Pattern: 4 days on, 4 days off
- Extended work and rest periods

### 3. Setting Start Dates for Rotating Schedules

For 2/2, 3/3, and 4/4 schedules, the system uses today's date as the start.

**Important:** If an employee has an existing rotation:
- Ask them which day they're on in their current cycle
- Calculate backwards to find when their current cycle started
- You may need admin help to manually set the correct start date via API

## 🚫 Common Issues & Solutions

### Issue: "User @username not found"
**Solution:** The employee hasn't started the bot yet. Have them:
1. Open Telegram
2. Search for your bot
3. Send `/start`

### Issue: "Maximum 2 team members already have leave on..."
**Solution:** This is working correctly! Only 2 people from the same shift can have leave on the same day. Options:
- Employee can book different dates
- Check if employee's shift is set correctly
- Consider if this should be an emergency leave

### Issue: "The following dates are not work days..."
**Solution:** The dates don't match the employee's schedule. Check:
- Is their schedule type correct? (mon_fri vs 2_2, etc.)
- For rotating schedules, is the start date correct?
- Are they trying to book weekends on a mon_fri schedule?

### Issue: "Leave must be booked at least 14 days in advance"
**Solution:** 
- Team members must book 14+ days ahead (policy)
- Supervisors and admins can use `--emergency` flag to bypass
- Example: `/book 2025-10-10 2025-10-12 Urgent --emergency`

## 🔐 Admin-Only Commands

These commands are only available to **edgemadzi**:

### Make Someone a Supervisor
```
/makesupervisor @username
```

### Approve Leave Requests
```
/approve <request_id>
```

## 📱 Quick Reference Card

```
┌─────────────────────────────────────────┐
│       SUPERVISOR COMMANDS                │
├─────────────────────────────────────────┤
│ /team              - View your team      │
│ /addmember @user   - Add team member     │
│ /setschedule ID... - Set schedule        │
│ /book ... --emergency - Emergency leave  │
│ /status            - View all requests   │
└─────────────────────────────────────────┘

SCHEDULE TYPES:
• mon_fri - Monday to Friday
• 2_2      - 2 on, 2 off
• 3_3      - 3 on, 3 off
• 4_4      - 4 on, 4 off

SHIFTS:
• day      - Day shift
• night    - Night shift
• evening  - Evening shift
• rotating - Rotating
```

## 💡 Pro Tips

1. **Set schedules immediately** after adding a member (defaults to day/mon_fri)
2. **Use descriptive reasons** when booking emergency leave
3. **Check /team regularly** to see your team's configuration
4. **Coordinate with other supervisors** to avoid too many leave requests on the same dates
5. **Plan ahead** - Remember the 14-day rule for team members

## 🆘 Need Help?

If you encounter issues:
1. Check this guide first
2. Try `/help` in the bot
3. Contact the admin (@edgemadzi)
4. Check the leave is within rules (14 days advance, work days only, max 2 per shift per day)

---

**Admin Contact:** @edgemadzi
**Bot Commands:** Send `/help` in Telegram
