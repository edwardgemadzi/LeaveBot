# Calendar Component Review

**Date**: October 8, 2025  
**Component**: `src/components/InteractiveCalendar.tsx` (232 lines)  
**Status**: ⚠️ Missing critical props in App.tsx integration

---

## Overview

The InteractiveCalendar component is **well-structured and properly refactored** with:
- ✅ Custom hooks for data fetching (`useTeamMembersSettings`, `useCalendarEvents`)
- ✅ Utility functions for working days calculations
- ✅ Good separation of concerns
- ✅ No compilation errors
- ✅ TypeScript properly typed

However, there are **integration issues** with how it's used in App.tsx.

---

## Critical Issues Found

### 1. Missing Props in App.tsx ⚠️ HIGH PRIORITY

**Current implementation** (line 265-269 in App.tsx):
```tsx
{currentView === 'calendar' && (
  <InteractiveCalendar
    leaves={leaves}
    user={user!}
    token={token}
  />
)}
```

**Problems**:
- ❌ Missing `userSettings` prop (used for working days validation)
- ❌ Missing `onRequestLeave` callback (calendar can't open request form)
- ❌ Missing `showToast` callback (calendar can't show user feedback)
- ❌ Missing `onRefresh` callback (can't refresh after actions)

**Expected interface**:
```tsx
interface LeaveCalendarProps {
  user: User
  leaves: Leave[]
  userSettings?: UserSettings | null    // ❌ MISSING
  token: string
  onRequestLeave?: (startDate: Date, endDate: Date) => void  // ❌ MISSING
  onRefresh?: () => void                // ❌ MISSING
  showToast?: (message: string) => void // ❌ MISSING
}
```

**Impact**:
1. **No working days validation** - Users can select non-working days without proper validation
2. **Can't request leaves from calendar** - Clicking dates or "Request Leave" button does nothing
3. **No user feedback** - Users get no messages for validation errors or selection info
4. **Can't refresh data** - Calendar doesn't update after leave requests

---

## Code Quality Analysis

### ✅ Strengths

1. **Hook Extraction** (Good separation):
   - `useTeamMembersSettings` - Fetches team member settings
   - `useCalendarEvents` - Transforms leaves into calendar events
   - Both hooks properly use `useMemo` for performance

2. **Utility Functions** (Well organized):
   - `isWorkingDay()` - Validates working days
   - `calculateWorkingDaysCount()` - Counts working days in range
   - `splitLeaveByWorkingDays()` - Splits leaves by working days
   - `getEventStyle()` - Color coding for events
   - `getDayStyle()` - Styling for non-working days

3. **User Experience Features**:
   - Visual legend showing leave types
   - Color-coded events (approved, pending, rejected)
   - Non-working days highlighted
   - Team/personal leave toggle for users
   - Drag-to-select date ranges
   - Click events to see leave details

4. **Role-Based Logic**:
   - Admins see all leaves
   - Leaders see team leaves
   - Users can toggle team/personal view
   - Only users can request leaves from calendar

5. **Validation Logic**:
   - First day must be working day
   - Warns about non-working days in selection
   - Calculates and displays working days count

### ⚠️ Potential Issues

1. **User Settings Dependency**:
   - Calendar needs `userSettings` to validate working days
   - Without it, `isWorkingDay()` falls back to weekdays only (Mon-Fri)
   - This means shift patterns (e.g., 4-on-4-off) won't work correctly

2. **Missing Request Flow**:
   - `onRequestLeave` callback not connected
   - Users can't actually request leaves from calendar
   - "Request Leave" button renders but may not work

3. **No Toast Notifications**:
   - Validation messages fall back to nothing or alerts
   - Poor user experience without feedback

4. **State Management**:
   - `showTeamOnly` state defaults to `true`
   - Could be confusing for users who want to see only their leaves
   - No persistence (resets on component remount)

---

## Comparison with Dashboard Refactoring

### What Dashboard Did Right:
- ✅ Extracted multiple sub-components
- ✅ Created dedicated hooks for logic
- ✅ Minimal main component (115 lines)
- ✅ All props properly passed from App.tsx

### Calendar Current State:
- ✅ Has custom hooks (good!)
- ⚠️ Could extract more sub-components (232 lines is manageable but could be better)
- ❌ Props not properly passed from App.tsx (integration issue)
- ⚠️ No error handling for missing props

---

## Recommended Fixes

### Priority 1: Fix App.tsx Integration (CRITICAL)

**Required changes to App.tsx**:

1. **Fetch user settings** (if not already available):
   ```tsx
   const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
   
   useEffect(() => {
     if (user) {
       fetchUserSettings(user.id, token)
         .then(setUserSettings)
         .catch(error => console.error('Failed to fetch settings:', error))
     }
   }, [user, token])
   ```

2. **Pass all required props**:
   ```tsx
   {currentView === 'calendar' && (
     <InteractiveCalendar
       leaves={leaves}
       user={user!}
       userSettings={userSettings}
       token={token}
       onRequestLeave={(startDate, endDate) => {
         // Store dates and switch to form view
         setRequestDates({ startDate, endDate })
         setCurrentView('form')
       }}
       onRefresh={refetchLeaves}
       showToast={success} // Use toast from useToast hook
     />
   )}
   ```

3. **Add state for pre-filled dates**:
   ```tsx
   const [requestDates, setRequestDates] = useState<{
     startDate: Date
     endDate: Date
   } | null>(null)
   ```

4. **Pre-fill form with calendar dates**:
   ```tsx
   {currentView === 'form' && (
     <LeaveRequestForm
       // ... existing props
       initialStartDate={requestDates?.startDate}
       initialEndDate={requestDates?.endDate}
     />
   )}
   ```

### Priority 2: Optional Component Extraction (NICE-TO-HAVE)

The calendar is already well-structured, but could be improved:

**Potential extractions**:
1. `CalendarHeader.tsx` - Title, subtitle, toggle, and button (40 lines)
2. `CalendarLegend.tsx` - Color legend display (30 lines)
3. `useCalendarSelection.ts` - Selection validation logic (50 lines)

**Benefits**:
- Main component: 232 → ~110 lines
- Better testability
- Reusable legend component

**Trade-off**:
- Not critical (calendar works fine at 232 lines)
- More files to maintain
- Current structure is already clean

---

## Testing Checklist

### Current State (With Missing Props):
- [ ] Can view calendar (works)
- [ ] Can see team leaves (works)
- [ ] Can toggle team/personal view (works)
- [ ] Non-working days highlighted (partial - needs userSettings)
- [ ] Click to select dates (doesn't open form - needs onRequestLeave)
- [ ] "Request Leave" button (doesn't work - needs onRequestLeave)
- [ ] Validation messages (falls back to alerts - needs showToast)
- [ ] Working days calculation (partial - needs userSettings)

### After Fixes:
- [ ] User settings loaded correctly
- [ ] Working days validation works with shift patterns
- [ ] Selecting dates opens pre-filled form
- [ ] "Request Leave" button opens form
- [ ] Toast messages show for validation
- [ ] Calendar refreshes after leave requests
- [ ] Non-working days properly highlighted
- [ ] Working days count accurate

---

## Architecture Assessment

### Current Structure:
```
InteractiveCalendar.tsx (232 lines)
├── useTeamMembersSettings() → Fetch team settings
├── useCalendarEvents() → Transform leaves to events
├── handleSelectSlot() → Date selection logic
├── handleSelectEvent() → Click event details
├── eventStyleGetter() → Event styling
├── dayPropGetter() → Day styling
└── JSX → Header, legend, calendar component
```

### Comparison to Dashboard Pattern:
- **Dashboard**: Extracted to 7 files (115 main + 6 sub-components/hooks)
- **Calendar**: 1 file (232 lines) with 2 external hooks
- **Assessment**: Calendar is simpler and doesn't need as aggressive extraction

---

## Recommendations Summary

### Must Fix (High Priority):
1. ✅ **Fix App.tsx integration** - Pass missing props (5 minutes)
2. ✅ **Fetch user settings** - Add to App.tsx state (10 minutes)
3. ✅ **Connect request flow** - Link calendar to form (5 minutes)
4. ✅ **Add toast notifications** - Pass success function (2 minutes)

**Total time**: ~20 minutes  
**Impact**: Critical - Makes calendar fully functional

### Nice to Have (Low Priority):
1. ⚠️ **Extract sub-components** - CalendarHeader, CalendarLegend (30 minutes)
2. ⚠️ **Extract selection hook** - useCalendarSelection (20 minutes)
3. ⚠️ **Add state persistence** - Remember showTeamOnly preference (10 minutes)
4. ⚠️ **Improve error handling** - Handle missing props gracefully (15 minutes)

**Total time**: ~75 minutes  
**Impact**: Low - Incremental improvements

---

## Conclusion

**Calendar Component Status**: ✅ **Well-structured** but ❌ **Incorrectly integrated**

The InteractiveCalendar.tsx component itself is **well-refactored** with:
- Good hook extraction
- Clean utility functions
- Proper TypeScript typing
- No compilation errors

However, **App.tsx integration is broken** with missing critical props:
- No user settings → Working days validation incomplete
- No callbacks → Calendar can't request leaves or show feedback
- No refresh → Can't update after actions

**Immediate Action Required**: Fix App.tsx integration (20 minutes)  
**Optional Enhancement**: Extract sub-components (75 minutes)

The calendar doesn't need the same level of refactoring as Dashboard (which was 655 lines of monolithic code). At 232 lines with good separation of concerns, it's already maintainable. The **real issue is the missing props**, not the component structure.

---

## Next Steps

1. **Fix App.tsx immediately** (HIGH)
   - Add userSettings state
   - Pass all required props to InteractiveCalendar
   - Connect request flow to form
   - Add toast notifications

2. **Test calendar thoroughly** (HIGH)
   - Verify working days validation
   - Test date selection → form flow
   - Check toast messages appear
   - Validate calendar refreshes

3. **Optional refactoring** (LOW)
   - Extract sub-components if team prefers
   - Add state persistence
   - Improve error handling

4. **Update documentation** (MEDIUM)
   - Document calendar props requirements
   - Add integration examples
   - Note shift pattern dependencies
