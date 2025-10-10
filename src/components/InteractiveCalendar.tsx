import React, { useState } from 'react'
import { addDays } from 'date-fns'
import { Plus } from 'lucide-react'
import type { Leave, User, UserSettings, CalendarEvent } from '../types'
import { useTeamMembersSettings } from '../hooks/useTeamMembersSettings'
import { useCalendarEvents } from '../hooks/useCalendarEvents'
import { getEventStyle, getDayStyle } from '../utils/calendarStyles'
import { CalendarControls, CalendarContainer, CalendarLegend, useCalendarEventHandlers } from './Calendar'

function CalendarHeader({ user, onRequestLeave }: { user: User; onRequestLeave?: (startDate: Date, endDate: Date) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <div>
        <h2 style={{ marginBottom: '8px', color: '#333' }}>
          {user.role === 'admin' ? 'Team Leave Calendar' : 'Leave Calendar'}
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          {user.role === 'user' ? 'Click and drag on the calendar to select dates for a new leave request' : 'View team leave schedules and manage approvals'}
        </p>
      </div>
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
  )
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

export default function LeaveCalendar({ user, leaves, userSettings, token, onRequestLeave, onRefresh, showToast }: LeaveCalendarProps) {
  const [view, setView] = useState<string>('month')
  // Default to showing team leaves for both leaders and regular users
  const [showTeamOnly, setShowTeamOnly] = useState(true)
  
  // Fetch all team members' settings using custom hook
  const { teamMembersSettings } = useTeamMembersSettings(leaves, token)
  
  // Generate calendar events using custom hook
  const events = useCalendarEvents({ leaves, user, showTeamOnly, teamMembersSettings })

  // Use custom hook for event handlers
  const { handleSelectSlot, handleSelectEvent } = useCalendarEventHandlers({
    user,
    userSettings,
    onRequestLeave,
    showToast
  });

  const eventStyleGetter = (event: CalendarEvent) => {
    return getEventStyle(event, user)
  }

  // Style non-working days differently to show user's actual working days
  const dayPropGetter = (date: Date) => {
    return getDayStyle(date, userSettings)
  }

  return (
    <div className="p-5">
      <CalendarHeader user={user} onRequestLeave={onRequestLeave} />
      
      <CalendarControls
        user={user}
        showTeamOnly={showTeamOnly}
        onShowTeamOnlyChange={setShowTeamOnly}
      />

      <CalendarLegend userSettings={userSettings} />

      <CalendarContainer
        events={events}
        view={view}
        onViewChange={setView}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventStyleGetter={eventStyleGetter}
        dayPropGetter={dayPropGetter}
      />
    </div>
  )
}
