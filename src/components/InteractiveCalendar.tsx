import { useState } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addDays } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { Plus } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import type { Leave, User, UserSettings, CalendarEvent } from '../types'
import { useTeamMembersSettings } from '../hooks/useTeamMembersSettings'
import { useCalendarEvents } from '../hooks/useCalendarEvents'
import { isWorkingDay, calculateWorkingDaysCount } from '../utils/workingDays'
import { getEventStyle, getDayStyle } from '../utils/calendarStyles'
import { formatDisplayDate } from '../utils/dateHelpers'

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

interface LeaveCalendarProps {
  user: User
  leaves: Leave[]
  userSettings?: UserSettings | null
  token: string
  onRequestLeave?: (startDate: Date, endDate: Date) => void
  onRefresh?: () => void
  showToast?: (message: string) => void
}

export default function LeaveCalendar({ user, leaves, userSettings, token, onRequestLeave, onRefresh, showToast }: LeaveCalendarProps) {
  const [view, setView] = useState<string>('month')
  // Default to showing team leaves for both leaders and regular users
  const [showTeamOnly, setShowTeamOnly] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  
  // Fetch all team members' settings using custom hook
  const { teamMembersSettings } = useTeamMembersSettings(leaves, token)
  
  // Generate calendar events using custom hook
  const events = useCalendarEvents({ leaves, user, showTeamOnly, teamMembersSettings })

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
      
      // Calculate working days count using utility
      const workingDaysCount = calculateWorkingDaysCount(start, end, userSettings)
      
      if (showToast) {
        showToast(`Selected: ${formatDisplayDate(start)} - ${formatDisplayDate(end)} (${workingDaysCount} working days). Opening request form...`)
      }
      
      onRequestLeave(start, end)
    }
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    const leave = event.resource
    const message = `${leave.employeeName} • ${formatDisplayDate(leave.startDate)} - ${formatDisplayDate(leave.endDate)} • ${leave.status.toUpperCase()}${leave.reason ? ` • ${leave.reason}` : ''}`
    
    if (showToast) {
      showToast(message)
    } else {
      // Fallback to alert if showToast not provided
      alert(
        `${leave.employeeName}\n` +
        `${formatDisplayDate(leave.startDate)} - ${formatDisplayDate(leave.endDate)}\n` +
        `Status: ${leave.status}\n` +
        `${leave.reason ? `Reason: ${leave.reason}` : ''}`
      )
    }
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    return getEventStyle(event, user)
  }

  // Style non-working days differently to show user's actual working days
  const dayPropGetter = (date: Date) => {
    return getDayStyle(date, userSettings)
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
