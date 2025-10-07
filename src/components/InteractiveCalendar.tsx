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

interface LeaveCalendarProps {
  user: User
  leaves: Leave[]
  onRequestLeave?: (startDate: Date, endDate: Date) => void
  onRefresh?: () => void
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Leave
}

export default function LeaveCalendar({ user, leaves, onRequestLeave, onRefresh }: LeaveCalendarProps) {
  const [view, setView] = useState<string>('month')
  const [showTeamOnly, setShowTeamOnly] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)

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

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedSlot(slotInfo)
    // Show confirmation or open request form
    if (onRequestLeave && confirm(`Request leave from ${format(slotInfo.start, 'MMM dd')} to ${format(slotInfo.end, 'MMM dd')}?`)) {
      onRequestLeave(slotInfo.start, slotInfo.end)
      setSelectedSlot(null)
    }
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    const leave = event.resource
    alert(
      `${leave.employeeName}\n` +
      `${format(new Date(leave.startDate), 'MMM dd, yyyy')} - ${format(new Date(leave.endDate), 'MMM dd, yyyy')}\n` +
      `Status: ${leave.status}\n` +
      `${leave.reason ? `Reason: ${leave.reason}` : ''}`
    )
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
            Click and drag to select dates for a new leave request
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
