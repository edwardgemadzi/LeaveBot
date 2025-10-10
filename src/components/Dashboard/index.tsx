import React, { useMemo } from 'react'
import { LeaveBalance } from '../LeaveBalance'
import type { Leave, User } from '../../types'
import { useLeaveActions } from '../../hooks/useLeaveActions'
import DashboardStatistics from './DashboardStatistics'
import UpcomingLeaves from './UpcomingLeaves'
import RecentActivity from './RecentActivity'
import PasswordOverrideModal from './PasswordOverrideModal'

interface DashboardProps {
  user: User
  leaves: Leave[]
  token?: string
  onLeaveUpdate?: () => void
}

export default function Dashboard({ user, leaves, token, onLeaveUpdate }: DashboardProps) {
  const {
    processing,
    error,
    overrideModal,
    overridePassword,
    passwordError,
    setOverridePassword,
    handleLeaveAction,
    handlePasswordOverride,
    cancelOverride,
  } = useLeaveActions(token || '', onLeaveUpdate)

  // Helper to calculate working days (falls back to calendar days if not available)
  const calculateDaysForLeave = (leave: Leave) => {
    if (leave.workingDaysCount) return leave.workingDaysCount
    // Fallback: calculate calendar days
    const start = new Date(leave.startDate)
    const end = new Date(leave.endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  const stats = useMemo(() => {
    if (user.role === 'admin' || user.role === 'leader') {
      // Admin/Leader sees all team leaves statistics (backend filters by team for leaders)
      const approvedLeaves = leaves.filter(l => l.status === 'approved')
      const workingDaysUsed = approvedLeaves.reduce((sum, leave) => sum + calculateDaysForLeave(leave), 0)
      
      return {
        total: leaves.length,
        pending: leaves.filter(l => l.status === 'pending').length,
        approved: approvedLeaves.length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
        thisMonth: leaves.filter(l => {
          const date = new Date(l.createdAt)
          const now = new Date()
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
        }).length,
        workingDaysUsed,
      }
    } else {
      // User sees only their leaves
      const myLeaves = leaves.filter(l => l.userId === user.id)
      const approvedLeaves = myLeaves.filter(l => l.status === 'approved')
      const workingDaysUsed = approvedLeaves.reduce((sum, leave) => sum + calculateDaysForLeave(leave), 0)
      
      return {
        total: myLeaves.length,
        pending: myLeaves.filter(l => l.status === 'pending').length,
        approved: approvedLeaves.length,
        rejected: myLeaves.filter(l => l.status === 'rejected').length,
        thisMonth: myLeaves.filter(l => {
          const date = new Date(l.createdAt)
          const now = new Date()
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
        }).length,
        workingDaysUsed,
      }
    }
  }, [leaves, user])

  const upcomingLeaves = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let filteredLeaves = leaves
    // Regular users only see their own upcoming leaves
    // Admin and Leader see all team upcoming leaves (backend filters by team for leaders)
    if (user.role !== 'admin' && user.role !== 'leader') {
      filteredLeaves = leaves.filter(l => l.userId === user.id)
    }
    
    return filteredLeaves
      .filter(l => {
        const startDate = new Date(l.startDate)
        return startDate >= today && l.status === 'approved'
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 5)
  }, [leaves, user])

  const recentActivity = useMemo(() => {
    let filteredLeaves = leaves
    if (user.role !== 'admin' && user.role !== 'leader') {
      filteredLeaves = leaves.filter(l => l.userId === user.id)
    }
    
    return [...filteredLeaves]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [leaves, user])

  return (
    <div className="p-5">
      <h1 className="text-[28px] font-bold mb-1 text-gray-900">
        {user.role === 'admin' ? 'Admin Dashboard' : user.role === 'leader' ? 'Team Dashboard' : 'My Dashboard'}
      </h1>

      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded-lg mb-5 border border-red-200">{error}</div>
      )}

      {/* Leave Balance - Only show for regular users */}
      {user.role !== 'admin' && user.role !== 'leader' && token && (
        <LeaveBalance 
          key={leaves.filter(l => l.userId === user.id && l.status === 'approved').length} 
          userId={user.id} 
          token={token} 
        />
      )}

      {/* Statistics Cards */}
      <DashboardStatistics stats={stats} />

      {/* Two Column Layout */}
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))] gap-7.5">
        <UpcomingLeaves upcomingLeaves={upcomingLeaves} />
        <RecentActivity 
          recentActivity={recentActivity}
          user={user}
          processing={processing}
          onLeaveAction={handleLeaveAction}
        />
      </div>
      
      {/* Password Override Modal */}
      <PasswordOverrideModal
        overrideModal={overrideModal}
        overridePassword={overridePassword}
        passwordError={passwordError}
        processing={processing}
        onPasswordChange={setOverridePassword}
        onPasswordOverride={handlePasswordOverride}
        onCancelOverride={cancelOverride}
      />
    </div>
  )
}
