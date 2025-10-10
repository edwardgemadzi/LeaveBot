/**
 * Dedicated Leader Page Component
 * Contains all leader-specific functionality
 */

import React, { useState } from 'react'
import { User, Team, Leave } from '../types'
import { useTeams } from '../hooks/useTeams'
import { useUsers } from '../hooks/useUsers'
import { useLeaves } from '../hooks/useLeaves'
import { useUserOperations } from '../hooks/useUserOperations'
import { useTeamOperations } from '../hooks/useTeamOperations'
import { useLeaveActions } from '../hooks/useLeaveActions'
import { useToast } from '../hooks/useToast'
import UserManagementRefactored from './UserManagementRefactored'
import TeamManagementRefactored from './TeamManagementRefactored'
import { LeaveListView } from './App/LeaveListView'
import DashboardRefactored from './DashboardRefactored'
import LeaveCalendar from './InteractiveCalendar'

interface LeaderPageProps {
  user: User
  token: string
  currentView: 'dashboard' | 'calendar' | 'list' | 'team'
  onViewChange: (view: 'dashboard' | 'calendar' | 'list' | 'team') => void
}

export default function LeaderPage({ user, token, currentView, onViewChange }: LeaderPageProps) {
  const { teams, loading: teamsLoading, error: teamsError, refetch: refetchTeams } = useTeams(token)
  const { users, loading: usersLoading, error: usersError, refetch: refetchUsers } = useUsers(token)
  const { leaves, loading: leavesLoading, error: leavesError, refetch: refetchLeaves } = useLeaves(token)
  const { showToast, showError } = useToast()

  const handleLeaveUpdate = async () => {
    await refetchLeaves()
    showToast('Leave request updated successfully!')
  }

  const handleUserUpdate = async () => {
    await refetchUsers()
    showToast('User updated successfully!')
  }

  const handleTeamUpdate = async () => {
    await refetchTeams()
    showToast('Team updated successfully!')
  }

  // Leader-specific navigation
  const leaderTabs = [
    { id: 'dashboard', label: '📊 Dashboard', view: 'dashboard' as const },
    { id: 'calendar', label: '📅 Calendar', view: 'calendar' as const },
    { id: 'list', label: '📋 Requests', view: 'list' as const },
    { id: 'team', label: '👥 Team Management', view: 'team' as const },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Leader Navigation */}
      <div className="bg-white border-b border-slate-200 py-4 px-7">
        <div className="max-w-[1400px] mx-auto flex gap-2.5 flex-wrap">
          {leaderTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.view)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === tab.view
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leader Content */}
      <div className="max-w-[1400px] mx-auto p-7">
        {currentView === 'dashboard' && (
          <DashboardRefactored 
            user={user} 
            leaves={leaves} 
            token={token} 
            onLeaveUpdate={handleLeaveUpdate}
          />
        )}

        {currentView === 'calendar' && (
          <LeaveCalendar
            user={user}
            leaves={leaves}
            token={token}
            teamMembers={[]}
            onRefresh={handleLeaveUpdate}
            showToast={showToast}
            showError={showError}
          />
        )}

        {currentView === 'list' && (
          <LeaveListView
            leaves={leaves}
            loading={leavesLoading}
            error={leavesError}
            user={user}
            token={token}
            onLeaveUpdate={handleLeaveUpdate}
          />
        )}

        {currentView === 'team' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">👥 Team Management</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team Settings */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🏢 Team Settings</h3>
                <TeamManagementRefactored 
                  currentUser={user} 
                  token={token} 
                />
              </div>

              {/* Team Members */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">👤 Team Members</h3>
                <UserManagementRefactored 
                  currentUser={user} 
                  token={token} 
                  teams={teams}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
