import React, { useState, useMemo } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import { Plus } from 'lucide-react'
import type { Leave, User, UserSettings, CalendarEvent } from '../types'
import LeaveRequestForm from './Leaves/LeaveRequestForm'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

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
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [selectedDates, setSelectedDates] = useState<{ startDate: Date; endDate: Date } | null>(null)

  // Convert leaves to calendar events
  const events = useMemo(() => {
    return leaves.map(leave => ({
      id: leave.id || leave._id,
      title: `${leave.employeeName} - ${leave.reason || 'Leave'}`,
      start: new Date(leave.startDate),
      end: new Date(leave.endDate),
      resource: {
        status: leave.status,
        leaveId: leave.id || leave._id,
        employeeName: leave.employeeName
      }
    }))
  }, [leaves])

  // Handle slot selection for leave requests
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    if (user.role === 'user') {
      setSelectedDates({ startDate: start, endDate: end })
      setShowRequestForm(true)
    }
  }

  // Handle event selection
  const handleSelectEvent = (event: any) => {
    console.log('Event clicked:', event)
  }

  // Custom event style based on status
  const eventStyleGetter = (event: any) => {
    const status = event.resource?.status
    let backgroundColor = '#3174ad'
    
    switch (status) {
      case 'approved':
        backgroundColor = '#10b981'
        break
      case 'rejected':
        backgroundColor = '#ef4444'
        break
      case 'pending':
        backgroundColor = '#f59e0b'
        break
      default:
        backgroundColor = '#3174ad'
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    }
  }

  return (
    <div className="p-5">
      <CalendarHeader user={user} onShowRequestForm={() => setShowRequestForm(true)} />
      
      {/* Calendar Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={() => setView('month')}
          style={{
            padding: '8px 16px',
            background: view === 'month' ? '#3b82f6' : '#e5e7eb',
            color: view === 'month' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Month
        </button>
        <button
          onClick={() => setView('week')}
          style={{
            padding: '8px 16px',
            background: view === 'week' ? '#3b82f6' : '#e5e7eb',
            color: view === 'week' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Week
        </button>
        <button
          onClick={() => setView('day')}
          style={{
            padding: '8px 16px',
            background: view === 'day' ? '#3b82f6' : '#e5e7eb',
            color: view === 'day' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Day
        </button>
      </div>

      {/* Calendar Legend */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', fontSize: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', background: '#10b981', borderRadius: '4px' }}></div>
          <span>Approved</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', background: '#f59e0b', borderRadius: '4px' }}></div>
          <span>Pending</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', background: '#ef4444', borderRadius: '4px' }}></div>
          <span>Rejected</span>
        </div>
      </div>

      {/* Working Calendar Component */}
      <div style={{ height: '600px', background: 'white', borderRadius: '8px', padding: '20px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          view={view}
          onView={setView}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable={user.role === 'user'}
          eventPropGetter={eventStyleGetter}
          popup
          showMultiDayTimes
          step={15}
          timeslots={4}
        />
      </div>

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
