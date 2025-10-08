// Calendar styling utilities
import type { CalendarEvent, User, UserSettings } from '../types'
import { isWorkingDay } from './workingDays'

/**
 * Get event styling based on leave status and ownership
 */
export function getEventStyle(event: CalendarEvent, currentUser: User) {
  const leave = event.resource
  let backgroundColor = '#3b82f6' // blue for approved team leaves
  
  if (leave.status === 'pending') {
    backgroundColor = '#f59e0b' // amber
  } else if (leave.status === 'rejected') {
    backgroundColor = '#ef4444' // red
  } else if (leave.userId === currentUser.id) {
    backgroundColor = '#10b981' // green for own leaves
  }

  return {
    style: {
      backgroundColor,
      borderRadius: '6px',
      opacity: 0.9,
      color: 'white',
      border: 'none',
      display: 'block'
    }
  }
}

/**
 * Get day styling to highlight non-working days
 */
export function getDayStyle(date: Date, userSettings?: UserSettings | null) {
  if (!userSettings) {
    return {} // No special styling if no user settings
  }

  const working = isWorkingDay(date, userSettings)
  
  if (!working) {
    return {
      style: {
        backgroundColor: '#f9fafb',
        color: '#9ca3af',
        textDecoration: 'line-through',
        opacity: 0.6
      }
    }
  }
  
  return {}
}

/**
 * Status badge styles
 */
export const statusBadgeStyles = {
  pending: { background: '#fef3c7', color: '#92400e', text: 'Pending' },
  approved: { background: '#d1fae5', color: '#065f46', text: 'Approved' },
  rejected: { background: '#fee2e2', color: '#991b1b', text: 'Rejected' },
}

/**
 * Leave type formatting with emojis
 */
export const leaveTypeFormatters: Record<string, string> = {
  vacation: '🏖️ Vacation',
  sick: '🤒 Sick Leave',
  personal: '🏠 Personal',
  study: '📚 Study Leave',
  maternity: '👶 Maternity',
  paternity: '👨‍👶 Paternity',
  bereavement: '🕊️ Bereavement',
  emergency: '🚨 Emergency',
  unpaid: '💼 Unpaid',
  other: '📝 Other'
}

export function formatLeaveType(leaveType?: string): string {
  if (!leaveType) return '📝 Other'
  return leaveTypeFormatters[leaveType] || '📝 Other'
}
