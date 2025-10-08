/**
 * Leave card component for displaying individual leave requests
 */

import { useState } from 'react'
import { Leave } from '../../types'
import { calculateCalendarDays, formatDisplayDate, formatDateRange } from '../../utils/dateHelpers'
import { formatLeaveType } from '../../utils/calendarStyles'

interface LeaveCardProps {
  leave: Leave
  isAdmin: boolean
  onStatusUpdate: (leaveId: string, status: 'approved' | 'rejected') => Promise<void>
  token: string
  showToast: (message: string) => void
  showError: (message: string) => void
}

export default function LeaveCard({
  leave,
  isAdmin,
  onStatusUpdate,
  token,
  showToast,
  showError,
}: LeaveCardProps) {
  const [checkingConflicts, setCheckingConflicts] = useState(false)
  const [concurrentInfo, setConcurrentInfo] = useState<any>(null)

  const calendarDays = calculateCalendarDays(leave.startDate, leave.endDate)
  const workingDays = leave.workingDaysCount || calendarDays

  const checkConflicts = async () => {
    setCheckingConflicts(true)
    try {
      const res = await fetch(`/api/leaves?action=calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startDate: leave.startDate,
          endDate: leave.endDate,
          userId: leave.userId,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setConcurrentInfo(data.concurrentInfo)
      }
    } catch (err) {
      console.error('Failed to check conflicts:', err)
    } finally {
      setCheckingConflicts(false)
    }
  }

  const getStatusColor = () => {
    switch (leave.status) {
      case 'approved':
        return { bg: '#d1fae5', text: '#065f46', border: '#10b981' }
      case 'rejected':
        return { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' }
      default:
        return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' }
    }
  }

  const statusColor = getStatusColor()

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderLeft: `4px solid ${statusColor.border}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '15px',
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>
            {leave.employeeName}
          </h3>
          <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
            {formatLeaveType(leave.leaveType)}
          </p>
        </div>
        <span
          style={{
            padding: '6px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '600',
            background: statusColor.bg,
            color: statusColor.text,
            textTransform: 'uppercase',
          }}
        >
          {leave.status}
        </span>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <p
          style={{
            margin: '0 0 8px 0',
            fontSize: '14px',
            color: '#374151',
          }}
        >
          <strong>📅 Dates:</strong> {formatDateRange(leave.startDate, leave.endDate)}
        </p>
        <p
          style={{
            margin: '0 0 8px 0',
            fontSize: '14px',
            color: '#374151',
          }}
        >
          <strong>📊 Duration:</strong> {workingDays} working day
          {workingDays !== 1 ? 's' : ''} ({calendarDays} calendar day
          {calendarDays !== 1 ? 's' : ''})
        </p>
        {leave.reason && (
          <p
            style={{
              margin: '0',
              fontSize: '14px',
              color: '#6b7280',
            }}
          >
            <strong>💭 Reason:</strong> {leave.reason}
          </p>
        )}
      </div>

      {leave.shiftPattern && (
        <p
          style={{
            margin: '0 0 15px 0',
            fontSize: '12px',
            color: '#9ca3af',
          }}
        >
          Shift: {leave.shiftPattern} {leave.shiftTime && `(${leave.shiftTime})`}
        </p>
      )}

      {isAdmin && leave.status === 'pending' && (
        <div
          style={{
            display: 'flex',
            gap: '10px',
            paddingTop: '15px',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <button
            onClick={() => onStatusUpdate(leave._id, 'approved')}
            style={{
              flex: 1,
              padding: '10px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            ✅ Approve
          </button>
          <button
            onClick={() => onStatusUpdate(leave._id, 'rejected')}
            style={{
              flex: 1,
              padding: '10px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            ❌ Reject
          </button>
        </div>
      )}

      {isAdmin && !concurrentInfo && (
        <button
          onClick={checkConflicts}
          disabled={checkingConflicts}
          style={{
            marginTop: '10px',
            padding: '8px 12px',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: checkingConflicts ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            width: '100%',
          }}
        >
          {checkingConflicts ? 'Checking...' : '🔍 Check Team Conflicts'}
        </button>
      )}

      {concurrentInfo && (
        <div
          style={{
            marginTop: '10px',
            padding: '12px',
            background: concurrentInfo.hasConflict ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${
              concurrentInfo.hasConflict ? '#fecaca' : '#bbf7d0'
            }`,
            borderRadius: '8px',
          }}
        >
          <p
            style={{
              margin: '0',
              fontSize: '13px',
              color: concurrentInfo.hasConflict ? '#991b1b' : '#065f46',
              fontWeight: '500',
            }}
          >
            {concurrentInfo.count} team member(s) on leave during this period
            {concurrentInfo.limit && ` (Limit: ${concurrentInfo.limit})`}
          </p>
        </div>
      )}

      <p
        style={{
          margin: '15px 0 0 0',
          fontSize: '12px',
          color: '#9ca3af',
        }}
      >
        Requested {formatDisplayDate(leave.createdAt)}
      </p>
    </div>
  )
}
