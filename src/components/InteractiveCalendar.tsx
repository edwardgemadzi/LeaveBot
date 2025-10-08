import { useMemo, useState, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addDays } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { Plus } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface Leave {
  _id: string
  employeeName: string
  userId: string
  startDate: string
  endDate: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

interface User {
  id: string
  username: string
  name: string
  role: 'admin' | 'leader' | 'user'
  teamId?: string
}

interface UserSettings {
  shiftPattern: {
    type: string
    customPattern?: string
    referenceDate?: string
  }
  shiftTime: {
    type: string
    customStart?: string
    customEnd?: string
  }
}

interface LeaveCalendarProps {
  user: User
  leaves: Leave[]
  userSettings?: UserSettings | null
  token: string
  onRequestLeave?: (startDate: Date, endDate: Date) => void
  onRefresh?: () => void
  showToast?: (message: string) => void
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Leave
}

export default function LeaveCalendar({ user, leaves, userSettings, token, onRequestLeave, onRefresh, showToast }: LeaveCalendarProps) {
  const [view, setView] = useState<string>('month')
  // Default to showing team leaves for both leaders and regular users
  const [showTeamOnly, setShowTeamOnly] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  // Store all team members' settings for accurate working day calculation
  const [teamMembersSettings, setTeamMembersSettings] = useState<Record<string, UserSettings>>({})

  // Fetch all team members' settings so we can display their leaves correctly
  useEffect(() => {
    const fetchTeamMembersSettings = async () => {
      try {
        // Get unique user IDs from leaves
        const userIds = Array.from(new Set(leaves.map(leave => leave.userId)))
        
        // Fetch settings for each user
        const settingsMap: Record<string, UserSettings> = {}
        
        await Promise.all(userIds.map(async (userId) => {
          try {
            const res = await fetch(`/api/users/${userId}/settings`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            
            if (res.ok) {
              const data = await res.json()
              if (data.settings) {
                settingsMap[userId] = data.settings
              }
            }
          } catch (err) {
            console.error(`Failed to fetch settings for user ${userId}:`, err)
          }
        }))
        
        setTeamMembersSettings(settingsMap)
      } catch (error) {
        console.error('Error fetching team members settings:', error)
      }
    }
    
    if (leaves.length > 0 && token) {
      fetchTeamMembersSettings()
    }
  }, [leaves, token])

  // Helper: Check if a date is a working day based on a user's shift pattern
  const isWorkingDay = (date: Date, settings?: UserSettings | null): boolean => {
    if (!settings) {
      return true // If no settings, allow all days
    }
    
    const { shiftPattern } = settings
    
    // For rotation patterns (2-2, 3-3, 4-4, 5-5, custom), check the cycle
    // These patterns work ANY day of the week, just rotating on/off cycles
    if (shiftPattern.type !== 'regular' && shiftPattern.referenceDate) {
      const referenceDate = new Date(shiftPattern.referenceDate)
      const daysSinceReference = Math.floor((date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // For custom patterns, use customPattern field
      if (shiftPattern.type === 'custom' && shiftPattern.customPattern) {
        // Custom pattern format: "WWWOO" where W=work, O=off
        const pattern = shiftPattern.customPattern.toUpperCase()
        const cycleLength = pattern.length
        const positionInCycle = ((daysSinceReference % cycleLength) + cycleLength) % cycleLength
        const dayChar = pattern[positionInCycle]
        
        return dayChar === 'W' // W = working day
      }
      
      // For standard rotation patterns (2-2, 3-3, etc.)
      const match = shiftPattern.type.match(/^(\d+)-(\d+)$/)
      if (match) {
        const workDays = parseInt(match[1])
        const offDays = parseInt(match[2])
        const cycleLength = workDays + offDays
        const positionInCycle = ((daysSinceReference % cycleLength) + cycleLength) % cycleLength
        
        // First part of cycle is working days
        return positionInCycle < workDays
      }
    }
    
    // For regular pattern, working days are always Mon-Fri
    if (shiftPattern.type === 'regular') {
      const dayOfWeek = date.getDay()
      // 0 = Sunday, 6 = Saturday
      return dayOfWeek >= 1 && dayOfWeek <= 5 // Monday to Friday
    }
    
    // Fallback: allow the day
    return true
  }

  // Helper: Split a leave into continuous working day ranges
  const splitLeaveIntoWorkingDayRanges = (leave: Leave, leaveOwnerSettings?: UserSettings | null): Array<{ start: Date; end: Date }> => {
    const startDate = new Date(leave.startDate)
    const endDate = new Date(leave.endDate)
    
    // If no settings for this user, return full range (don't filter)
    if (!leaveOwnerSettings) {
      return [{ start: startDate, end: addDays(endDate, 1) }]
    }

    const ranges: Array<{ start: Date; end: Date }> = []
    let currentRangeStart: Date | null = null
    
    // Iterate through each day in the leave period
    let currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const isWorking = isWorkingDay(currentDate, leaveOwnerSettings)
      
      if (isWorking) {
        if (!currentRangeStart) {
          // Start a new range
          currentRangeStart = new Date(currentDate)
        }
      } else {
        if (currentRangeStart) {
          // End the current range (yesterday was the last working day)
          const rangeEnd = new Date(currentDate)
          ranges.push({ start: currentRangeStart, end: rangeEnd })
          currentRangeStart = null
        }
      }
      
      // Move to next day
      currentDate = addDays(currentDate, 1)
    }
    
    // If there's an open range at the end, close it
    if (currentRangeStart) {
      ranges.push({ start: currentRangeStart, end: addDays(endDate, 1) })
    }
    
    return ranges.length > 0 ? ranges : [{ start: startDate, end: addDays(endDate, 1) }]
  }

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
      const workingDayRanges = splitLeaveIntoWorkingDayRanges(leave, leaveOwnerSettings)
      
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

  const handleSelectSlot = (slotInfo: any) => {
    // Only allow regular users to request leaves from calendar
    if (user.role !== 'user') {
      if (showToast) {
        showToast('Only regular users can request leaves. Admins and leaders manage team members.')
      }
      return
    }
    
    if (onRequestLeave) {
      const start = slotInfo.start
      let end = slotInfo.end
      
      // Calendar end date is exclusive, so subtract 1 day to get actual last day
      end = addDays(end, -1)
      
      // Validate: First day must be a working day (use current user's settings)
      if (!isWorkingDay(start, userSettings)) {
        if (showToast) {
          showToast('⚠️ The first day must be a working day according to your shift pattern.')
        }
        return
      }
      
      // Validate: Check if any selected days are non-working days
      let hasNonWorkingDay = false
      const current = new Date(start)
      while (current <= end) {
        if (!isWorkingDay(current, userSettings)) {
          hasNonWorkingDay = true
          break
        }
        current.setDate(current.getDate() + 1)
      }
      
      if (hasNonWorkingDay) {
        if (showToast) {
          showToast('ℹ️ Selection includes non-working days. Only working days will be counted.')
        }
      }
      
      // Calculate working days count
      const workingDaysCount = Array.from({ length: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1 }, (_, i) => {
        const d = new Date(start)
        d.setDate(d.getDate() + i)
        return d
      }).filter(d => isWorkingDay(d, userSettings)).length
      
      if (showToast) {
        showToast(`Selected: ${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')} (${workingDaysCount} working days). Opening request form...`)
      }
      
      onRequestLeave(start, end)
    }
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    const leave = event.resource
    const message = `${leave.employeeName} • ${format(new Date(leave.startDate), 'MMM dd, yyyy')} - ${format(new Date(leave.endDate), 'MMM dd, yyyy')} • ${leave.status.toUpperCase()}${leave.reason ? ` • ${leave.reason}` : ''}`
    
    if (showToast) {
      showToast(message)
    } else {
      // Fallback to alert if showToast not provided
      alert(
        `${leave.employeeName}\n` +
        `${format(new Date(leave.startDate), 'MMM dd, yyyy')} - ${format(new Date(leave.endDate), 'MMM dd, yyyy')}\n` +
        `Status: ${leave.status}\n` +
        `${leave.reason ? `Reason: ${leave.reason}` : ''}`
      )
    }
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    const leave = event.resource
    let backgroundColor = '#3b82f6' // blue for approved
    
    if (leave.status === 'pending') {
      backgroundColor = '#f59e0b' // amber
    } else if (leave.status === 'rejected') {
      backgroundColor = '#ef4444' // red
    } else if (leave.userId === user.id) {
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

  // Style non-working days differently to show user's actual working days
  const dayPropGetter = (date: Date) => {
    if (!userSettings) {
      return {} // No special styling if no user settings
    }

    const working = isWorkingDay(date)
    
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

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ marginBottom: '8px', color: '#333' }}>
            {user.role === 'admin' ? 'Team Leave Calendar' : 'Leave Calendar'}
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            {user.role === 'user' ? 'Click and drag on the calendar to select dates for a new leave request' : 'View team leave schedules and manage approvals'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Only show toggle for regular users in a team - leaders always see team leaves */}
          {user.role === 'user' && user.teamId && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showTeamOnly}
                onChange={(e) => setShowTeamOnly(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span>Show team leaves</span>
            </label>
          )}
          
          {onRequestLeave && (
            <button
              onClick={() => {
                const today = new Date()
                const tomorrow = addDays(today, 1)
                onRequestLeave(today, tomorrow)
              }}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px'
              }}
            >
              <Plus className="w-4 h-4" />
              Request Leave
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '20px', 
        fontSize: '13px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#10b981', borderRadius: '4px' }}></div>
          <span>My Leaves</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#3b82f6', borderRadius: '4px' }}></div>
          <span>Team Leaves</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#f59e0b', borderRadius: '4px' }}></div>
          <span>Pending</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#ef4444', borderRadius: '4px' }}></div>
          <span>Rejected</span>
        </div>
        {userSettings && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}></div>
            <span style={{ color: '#6b7280' }}>Non-Working Days</span>
          </div>
        )}
      </div>

      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        minHeight: '600px'
      }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '600px' }}
          view={view}
          onView={setView}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          slotPropGetter={dayPropGetter}
          popup
        />
      </div>
    </div>
  )
}
