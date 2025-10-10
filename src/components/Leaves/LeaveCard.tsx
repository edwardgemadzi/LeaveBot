/**
 * Leave card component for displaying individual leave requests
 */

import { useState } from 'react'
import { Leave } from '../../types'
import { calculateCalendarDays } from '../../utils/dateHelpers'
import { api } from '../../utils/api'
import { LeaveCardLayout } from './index'

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
  const [concurrentInfo, setConcurrentInfo] = useState<{ hasConflict?: boolean; count?: number; limit?: number } | null>(null)

  const calendarDays = calculateCalendarDays(leave.startDate, leave.endDate)
  const workingDays = leave.workingDaysCount || calendarDays

  const checkConflicts = async () => {
    setCheckingConflicts(true)
    try {
      const data = await api.leaves.calculate({
        startDate: leave.startDate,
        endDate: leave.endDate,
        userId: leave.userId,
      }, token)
      setConcurrentInfo(data.concurrentInfo)
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
    <LeaveCardLayout
      leave={leave}
      isAdmin={isAdmin}
      calendarDays={calendarDays}
      workingDays={workingDays}
      statusColor={statusColor}
      concurrentInfo={concurrentInfo}
      checkingConflicts={checkingConflicts}
      onStatusUpdate={onStatusUpdate}
      onCheckConflicts={checkConflicts}
    />
  )
}
