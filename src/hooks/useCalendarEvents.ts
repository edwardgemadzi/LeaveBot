// Custom hook for managing calendar events
import { useMemo } from 'react'
import type { Leave, User, CalendarEvent, UserSettings } from '../types'
import { splitLeaveByWorkingDays } from '../utils/workingDays'

interface UseCalendarEventsProps {
  leaves: Leave[]
  user: User
  showTeamOnly: boolean
  teamMembersSettings: Record<string, UserSettings>
}

export function useCalendarEvents({
  leaves,
  user,
  showTeamOnly,
  teamMembersSettings
}: UseCalendarEventsProps) {
  const events: CalendarEvent[] = useMemo(() => {
    let filteredLeaves = leaves

    // Filter based on user role and team view preference
    if (user.role === 'admin') {
      // Admins see all leaves (backend already filters appropriately)
      filteredLeaves = leaves
    } else if (user.role === 'leader') {
      // Leaders see their team's leaves (backend filters by team)
      // When showTeamOnly is off, show only their own leaves
      if (!showTeamOnly) {
        filteredLeaves = leaves.filter(l => l.userId === user.id)
      }
      // When on, backend already filtered by team, show all
    } else {
      // Regular users: backend returns all team leaves
      // When showTeamOnly is off, show only their own leaves
      // When on, show all team leaves
      if (!showTeamOnly) {
        filteredLeaves = leaves.filter(l => l.userId === user.id)
      }
      // When on, show all leaves (backend already filtered by team)
    }

    // Split each leave into working-day-only ranges
    const calendarEvents: CalendarEvent[] = []
    
    filteredLeaves.forEach(leave => {
      // Use the leave owner's settings, not the current user's settings
      const leaveOwnerSettings = teamMembersSettings[leave.userId] || null
      const workingDayRanges = splitLeaveByWorkingDays(leave, leaveOwnerSettings)
      
      workingDayRanges.forEach((range, index) => {
        calendarEvents.push({
          id: `${leave._id}-${index}`,
          title: `${leave.employeeName}${leave.status !== 'approved' ? ` (${leave.status})` : ''}`,
          start: range.start,
          end: range.end,
          resource: leave
        })
      })
    })
    
    return calendarEvents
  }, [leaves, user, showTeamOnly, teamMembersSettings])

  return events
}
