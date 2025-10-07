import { useMemo, useState } from 'react'
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
  workingDays: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
}

interface LeaveCalendarProps {
  user: User
  leaves: Leave[]
  userSettings?: UserSettings | null
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

export default function LeaveCalendar({ user, leaves, userSettings, onRequestLeave, onRefresh, showToast }: LeaveCalendarProps) {
  const [view, setView] = useState<string>('month')
  const [showTeamOnly, setShowTeamOnly] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)

  // Helper: Check if a date is a working day based on user's shift pattern
  const isWorkingDay = (date: Date): boolean => {
    if (!userSettings) return true // If no settings, allow all days
    
    const { shiftPattern, workingDays } = userSettings
    
    // For rotation patterns (2-2, 3-3, 4-4, 5-5), ONLY check the cycle, NOT weekdays
    // These patterns work ANY day of the week, just rotating on/off cycles
    if (shiftPattern.type !== 'regular' && shiftPattern.referenceDate) {
      const referenceDate = new Date(shiftPattern.referenceDate)
      const daysSinceReference = Math.floor((date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Extract cycle length from pattern type (e.g., "2-2" -> 2+2=4 day cycle)
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
    
    // For regular pattern, check working days configuration
    if (shiftPattern.type === 'regular') {
      const dayOfWeek = date.getDay()
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dayName = dayNames[dayOfWeek] as keyof typeof workingDays
      return workingDays[dayName] || false
    }
    
    // Fallback: allow the day
    return true
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
      // Regular users see only their own leaves
      filteredLeaves = leaves.filter(l => l.userId === user.id)
    }

    // Show all leaves (approved, pending, rejected) for visibility
    return filteredLeaves.map(leave => {
      const startDate = new Date(leave.startDate)
      // Add 1 day to end date to include the last day (calendar end is exclusive)
      const endDate = addDays(new Date(leave.endDate), 1)
      
      return {
        id: leave._id,
        title: `${leave.employeeName}${leave.status !== 'approved' ? ` (${leave.status})` : ''}`,
        start: startDate,
        end: endDate,
        resource: leave
      }
    })
  }, [leaves, user, showTeamOnly])

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
      
      // Validate: First day must be a working day
      if (!isWorkingDay(start)) {
        if (showToast) {
          showToast('⚠️ The first day must be a working day according to your shift pattern.')
        }
        return
      }
      
      // Validate: Check if any selected days are non-working days
      let hasNonWorkingDay = false
      const current = new Date(start)
      while (current <= end) {
        if (!isWorkingDay(current)) {
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
      }).filter(d => isWorkingDay(d)).length
      
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
          {(user.role === 'leader' || (user.role === 'user' && user.teamId)) && (
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
          popup
        />
      </div>
    </div>
  )
}
