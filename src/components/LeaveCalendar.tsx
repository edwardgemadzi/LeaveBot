import { useMemo } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
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
  role: 'admin' | 'user'
}

interface LeaveCalendarProps {
  user: User
  leaves: Leave[]
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Leave
}

export default function LeaveCalendar({ user, leaves }: LeaveCalendarProps) {
  const events: CalendarEvent[] = useMemo(() => {
    let filteredLeaves = leaves
    if (user.role !== 'admin') {
      filteredLeaves = leaves.filter(l => l.userId === user.id)
    }

    return filteredLeaves.map(leave => ({
      id: leave._id,
      title: `${leave.employeeName} - ${leave.status}`,
      start: new Date(leave.startDate),
      end: new Date(leave.endDate),
      resource: leave,
    }))
  }, [leaves, user])

  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status
    const colors = {
      pending: { backgroundColor: '#fbbf24', color: '#78350f' },
      approved: { backgroundColor: '#34d399', color: '#064e3b' },
      rejected: { backgroundColor: '#f87171', color: '#7f1d1d' },
    }

    return {
      style: {
        ...colors[status],
        borderRadius: '5px',
        border: 'none',
        display: 'block',
        fontSize: '13px',
        padding: '2px 5px',
      },
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#333', margin: 0 }}>
          {user.role === 'admin' ? 'Team Leave Calendar' : 'My Leave Calendar'}
        </h2>
        
        {/* Legend */}
        <div style={{ display: 'flex', gap: '15px', fontSize: '13px' }}>
          <LegendItem color="#34d399" label="Approved" />
          <LegendItem color="#fbbf24" label="Pending" />
          <LegendItem color="#f87171" label="Rejected" />
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        height: '600px'
      }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day']}
          defaultView="month"
          popup
          onSelectEvent={(event: CalendarEvent) => {
            const leave = event.resource
            alert(
              `Leave Details\n\n` +
              `Employee: ${leave.employeeName}\n` +
              `Status: ${leave.status.toUpperCase()}\n` +
              `Start: ${new Date(leave.startDate).toLocaleDateString()}\n` +
              `End: ${new Date(leave.endDate).toLocaleDateString()}\n` +
              `Reason: ${leave.reason}`
            )
          }}
        />
      </div>

      {events.length === 0 && (
        <p style={{
          textAlign: 'center',
          color: '#9ca3af',
          marginTop: '20px',
          fontSize: '15px'
        }}>
          No leave requests to display on calendar
        </p>
      )}
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{
        width: '16px',
        height: '16px',
        borderRadius: '3px',
        backgroundColor: color
      }} />
      <span style={{ color: '#4b5563', fontWeight: '500' }}>{label}</span>
    </div>
  )
}
