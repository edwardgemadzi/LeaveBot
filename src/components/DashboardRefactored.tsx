/**
 * Refactored Dashboard Component
 * Displays statistics, upcoming leaves, and recent activity
 */

import React from 'react'
import { LeaveBalance } from './LeaveBalance'
import type { Leave, User } from '../types'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { useLeaveActions } from '../hooks/useLeaveActions'
import { StatisticsCards } from './Dashboard/StatisticsCards'
import UpcomingLeaves from './Dashboard/UpcomingLeaves'
import RecentActivity from './Dashboard/RecentActivity'
import PasswordOverrideModal from './Dashboard/PasswordOverrideModal'

interface DashboardProps {
  user: User
  leaves: Leave[]
  token?: string
  onLeaveUpdate?: () => void
}

export default function Dashboard({ user, leaves, token, onLeaveUpdate }: DashboardProps) {
  const { stats, upcomingLeaves, recentActivity } = useDashboardStats(leaves, user)
  
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

  const handleApprove = (leaveId: string) => {
    handleLeaveAction(leaveId, 'approve')
  }

  const handleReject = (leaveId: string) => {
    handleLeaveAction(leaveId, 'reject')
  }

  const handleDelete = (leaveId: string) => {
    handleLeaveAction(leaveId, 'delete')
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px', color: '#111827' }}>
        {user.role === 'admin' ? 'Admin Dashboard' : user.role === 'leader' ? 'Team Dashboard' : 'My Dashboard'}
      </h1>

      {error && (
        <div
          style={{
            padding: '12px',
            background: '#fee2e2',
            color: '#991b1b',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #fecaca',
          }}
        >
          {error}
        </div>
      )}

      {/* Leave Balance - Only show for regular users */}
      {user.role !== 'admin' && user.role !== 'leader' && token && (
        <LeaveBalance
          key={leaves.filter((l) => l.userId === user.id && l.status === 'approved').length}
          userId={user.id}
          token={token}
        />
      )}

      {/* Statistics Cards */}
      <StatisticsCards stats={stats} />

      {/* Two Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
        }}
      >
        {/* Upcoming Leaves */}
        <UpcomingLeaves upcomingLeaves={upcomingLeaves} />

        {/* Recent Activity */}
        <RecentActivity
          recentActivity={recentActivity}
          user={user}
          processing={processing}
          onLeaveAction={handleLeaveAction}
        />
      </div>

      {/* Password Override Modal */}
      {overrideModal && (
        <PasswordOverrideModal
          overrideModal={overrideModal}
          overridePassword={overridePassword}
          passwordError={passwordError}
          processing={processing}
          onPasswordChange={setOverridePassword}
          onPasswordOverride={handlePasswordOverride}
          onCancelOverride={cancelOverride}
        />
      )}
    </div>
  )
}
