import React, { useState } from 'react'
import { addDays } from 'date-fns'
import { Plus } from 'lucide-react'
import type { Leave, User, UserSettings, CalendarEvent } from '../types'
import { useTeamMembersSettings } from '../hooks/useTeamMembersSettings'
import { useCalendarEvents } from '../hooks/useCalendarEvents'
import { getEventStyle, getDayStyle } from '../utils/calendarStyles'
import { CalendarControls, CalendarContainer, CalendarLegend, useCalendarEventHandlers } from './Calendar'
import LeaveRequestForm from './Leaves/LeaveRequestForm'

function CalendarHeader({ user, onShowRequestForm }: { user: User; onShowRequestForm?: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <div>
        <h2 style={{ marginBottom: '8px', color: '#333' }}>
          {user.role === 'admin' ? 'Team Leave Calendar' : 'Leave Calendar'}
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          {user.role === 'user' ? 'Click the button below to request leave or drag on the calendar to select dates' : 'View team leave schedules and manage approvals'}
        </p>
      </div>
      {user.role === 'user' && onShowRequestForm && (
        <button
          onClick={onShowRequestForm}
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
  teamMembers: any[]
  onRefresh?: () => void
  showToast?: (message: string) => void
  showError?: (message: string) => void
}

export default function LeaveCalendar({ user, leaves, userSettings, token, teamMembers, onRefresh, showToast, showError }: LeaveCalendarProps) {
  const [view, setView] = useState<string>('month')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [selectedDates, setSelectedDates] = useState<{ startDate: Date; endDate: Date } | null>(null)
  // All team members should see the team calendar (no toggle needed)
  const showTeamOnly = true
  
  // Fetch all team members' settings using custom hook
  const { teamMembersSettings } = useTeamMembersSettings(leaves, token)
  
  // Generate calendar events using custom hook
  const events = useCalendarEvents({ leaves, user, showTeamOnly, teamMembersSettings })

  // Handle slot selection for leave requests
  const handleSelectSlot = (slotInfo: any) => {
    if (user.role === 'user') {
      setSelectedDates({
        startDate: slotInfo.start,
        endDate: slotInfo.end
      })
      setShowRequestForm(true)
    }
  }

  // Handle event selection
  const handleSelectEvent = (event: CalendarEvent) => {
    // Could show event details in a popup if needed
    console.log('Selected event:', event)
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    return getEventStyle(event, user)
  }

  // No special day styling - all team members see the same calendar
  const dayPropGetter = (date: Date) => {
    return {} // No special styling for consistency across team members
  }

  return (
    <div className="p-5">
      <CalendarHeader user={user} onShowRequestForm={() => setShowRequestForm(true)} />
      
      {/* Remove calendar controls - all team members see the same team calendar */}

      {/* Remove calendar legend - all team members see the same calendar */}

      <CalendarContainer
        events={events}
        view={view}
        onViewChange={setView}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventStyleGetter={eventStyleGetter}
        dayPropGetter={dayPropGetter}
      />

      {/* Leave Request Form Popup */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-xl w-[90%] max-w-[600px] max-h-[90vh] overflow-auto shadow-2xl">
            <LeaveRequestForm
              user={user}
              token={token}
              teamMembers={teamMembers}
              initialStartDate={selectedDates?.startDate}
              initialEndDate={selectedDates?.endDate}
              onSuccess={() => {
                setShowRequestForm(false)
                setSelectedDates(null)
                if (onRefresh) onRefresh()
                if (showToast) showToast('Leave request submitted successfully!')
              }}
              onCancel={() => {
                setShowRequestForm(false)
                setSelectedDates(null)
              }}
              showToast={showToast || (() => {})}
              showError={showError || (() => {})}
            />
          </div>
        </div>
      )}
    </div>
  )
}
