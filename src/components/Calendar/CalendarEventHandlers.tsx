import React from 'react';
import { addDays } from 'date-fns';
import type { User, UserSettings, CalendarEvent } from '../../types';
import { isWorkingDay, calculateWorkingDaysCount } from '../../utils/workingDays';
import { formatDisplayDate } from '../../utils/dateHelpers';

interface CalendarEventHandlersProps {
  user: User;
  userSettings?: UserSettings | null;
  onRequestLeave?: (startDate: Date, endDate: Date) => void;
  showToast?: (message: string) => void;
}

export const useCalendarEventHandlers = ({
  user,
  userSettings,
  onRequestLeave,
  showToast
}: CalendarEventHandlersProps) => {
  const handleSelectSlot = (slotInfo: any) => {
    // Only allow regular users to request leaves from calendar
    if (user.role !== 'user') {
      if (showToast) {
        showToast('Only regular users can request leaves. Admins and leaders manage team members.');
      }
      return;
    }
    
    if (onRequestLeave) {
      const start = slotInfo.start;
      let end = slotInfo.end;
      
      // Calendar end date is exclusive, so subtract 1 day to get actual last day
      end = addDays(end, -1);
      
      // Validate: First day must be a working day (use current user's settings)
      if (!isWorkingDay(start, userSettings)) {
        if (showToast) {
          showToast('⚠️ The first day must be a working day according to your shift pattern.');
        }
        return;
      }
      
      // Validate: Check if any selected days are non-working days
      let hasNonWorkingDay = false;
      const current = new Date(start);
      while (current <= end) {
        if (!isWorkingDay(current, userSettings)) {
          hasNonWorkingDay = true;
          break;
        }
        current.setDate(current.getDate() + 1);
      }
      
      if (hasNonWorkingDay) {
        if (showToast) {
          showToast('ℹ️ Selection includes non-working days. Only working days will be counted.');
        }
      }
      
      // Calculate working days count using utility
      const workingDaysCount = calculateWorkingDaysCount(start, end, userSettings);
      
      if (showToast) {
        showToast(`Selected: ${formatDisplayDate(start)} - ${formatDisplayDate(end)} (${workingDaysCount} working days). Opening request form...`);
      }
      
      onRequestLeave(start, end);
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    const leave = event.resource;
    const message = `${leave.employeeName} • ${formatDisplayDate(leave.startDate)} - ${formatDisplayDate(leave.endDate)} • ${leave.status.toUpperCase()}${leave.reason ? ` • ${leave.reason}` : ''}`;
    
    if (showToast) {
      showToast(message);
    } else {
      // Fallback to alert if showToast not provided
      alert(
        `${leave.employeeName}\n` +
        `${formatDisplayDate(leave.startDate)} - ${formatDisplayDate(leave.endDate)}\n` +
        `Status: ${leave.status}\n` +
        `${leave.reason ? `Reason: ${leave.reason}` : ''}`
      );
    }
  };

  return {
    handleSelectSlot,
    handleSelectEvent
  };
};
