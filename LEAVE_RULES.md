# Leave Booking Rules - Implementation Summary

## 🎯 New Features Implemented

### 1. 14-Day Advance Booking Rule
- **Team members** must book leave at least 14 days in advance
- **Admin and Supervisors** can bypass this rule
- **Emergency leaves** (flagged with `--emergency`) bypass the rule

**Usage:**
```
# Regular booking (must be 14+ days ahead for team members)
/book 2025-10-25 2025-10-27 Vacation

# Emergency booking (admin/supervisor only)
/book 2025-10-10 2025-10-12 Sick leave --emergency
```

### 2. Maximum 2 Members Per Day Per Shift
- Only 2 team members from the same shift can book leave on the same day
- Shifts are isolated: day shift, night shift, evening shift, rotating
- This ensures adequate coverage for each shift

### 3. Work Schedule System
Employees can have different work schedules:

**Schedule Types:**
- `mon_fri` - Monday to Friday (5-day work week)
- `2_2` - 2 days on, 2 days off (rotating)
- `3_3` - 3 days on, 3 days off (rotating)
- `4_4` - 4 days on, 4 days off (rotating)
- `custom` - Custom days (e.g., specific weekdays)

**Shift Types:**
- `day` - Day shift workers
- `night` - Night shift workers
- `evening` - Evening shift workers
- `rotating` - Rotating shifts

### 4. Only Work Days Can Be Booked
- The system validates that leave is only requested for actual work days
- Based on the employee's schedule, non-work days are automatically rejected

## 📊 Database Schema Updates

### Employees Table
New fields added:
- `role` - admin | supervisor | team_member
- `shift` - day | night | evening | rotating
- `schedule_type` - mon_fri | 2_2 | 3_3 | 4_4 | custom
- `schedule_start_date` - For rotating schedules
- `work_days` - JSON array for custom schedules (e.g., `[1,2,3,4,5]` for Mon-Fri)
- `telegram_username` - Telegram username
- `telegram_chat_id` - Telegram chat ID

### Leave Requests Table
New fields added:
- `is_emergency` - Boolean flag for emergency leaves

## 🔧 API Endpoints

### POST /api/leave-requests/validate
Validates a leave request without creating it.

**Request:**
```json
{
  "employeeId": 1,
  "startDate": "2025-10-20",
  "endDate": "2025-10-22",
  "isEmergency": false
}
```

**Response:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": ["Emergency leave: bypassing advance booking requirement"]
}
```

### POST /api/leave-requests
Creates a leave request with validation.

**Request:**
```json
{
  "employeeId": 1,
  "startDate": "2025-10-20",
  "endDate": "2025-10-22",
  "reason": "Vacation",
  "isEmergency": false
}
```

### PUT /api/employees/:id/schedule
Update employee work schedule (admin only).

**Request:**
```json
{
  "role": "team_member",
  "shift": "day",
  "scheduleType": "2_2",
  "scheduleStartDate": "2025-10-01",
  "workDays": null
}
```

## 🤖 Telegram Bot Updates

### New Commands
```
/book 2025-10-20 2025-10-22 Vacation
  - Books regular leave (validates 14-day rule for team members)

/book 2025-10-10 2025-10-12 Emergency --emergency
  - Books emergency leave (admin/supervisor can bypass 14-day rule)

/start
  - Register and see your role (admin will see "🔑 You are the admin")
```

### Validation Messages
The bot now shows detailed validation errors:
```
❌ Cannot book leave:

• Leave must be booked at least 14 days in advance. You are 7 days short.
• The following dates are not work days: 2025-10-25, 2025-10-26
• Maximum 2 team members from your shift already have leave on: 2025-10-24
```

## 📝 Default Settings

When a new user registers via Telegram:
- **Role:** `team_member` (can be changed by admin)
- **Shift:** `day`
- **Schedule:** `mon_fri` (Monday-Friday)

## 🔐 Admin Username

Set in `/Users/edward/LeaveBot/bot/.env`:
```
ADMIN_USERNAME=edgemadzi
```

The admin can:
- Approve all leave requests
- Book emergency leaves
- Bypass the 14-day advance booking rule

## 🚀 Next Steps for Supervisor

To configure team members' schedules, you'll need to:

1. **Set employee roles and shifts** (via web interface or API)
2. **Configure work schedules** for rotating shifts (2/2, 3/3, etc.)
3. **Set schedule start dates** for rotating schedules

Example: For a team member on 2/2 schedule starting Oct 1:
```bash
curl -X PUT http://localhost:5001/api/employees/2/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "role": "team_member",
    "shift": "night",
    "scheduleType": "2_2",
    "scheduleStartDate": "2025-10-01"
  }'
```

## ✅ Testing the Rules

1. **Test 14-day rule:**
   ```
   /book 2025-10-10 2025-10-12 Too soon
   # Should fail for team members
   ```

2. **Test work day validation:**
   ```
   /book 2025-10-25 2025-10-26 Weekend
   # Should fail if these are Sat/Sun for mon_fri schedule
   ```

3. **Test max members per shift:**
   - Have 2 day shift members book the same day
   - Third day shift member tries to book same day → should fail
   - Night shift member can still book that day ✓

4. **Test emergency bypass:**
   ```
   /book 2025-10-10 2025-10-12 Emergency --emergency
   # Works for admin (edgemadzi)
   ```

All systems are running! 🎉
