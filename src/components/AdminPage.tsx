/**
 * Dedicated Admin Page Component
 * Contains all admin-specific functionality
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
import { UserManagementRefactored } from './UserManagement'
import TeamManagementRefactored from './TeamManagementRefactored'
import { LeaveListView } from './App/LeaveListView'
import DashboardRefactored from './DashboardRefactored'

interface AdminPageProps {
  user: User
  token: string
  currentView: 'dashboard' | 'list' | 'teams' | 'team' | 'team-settings'
  onViewChange: (view: 'dashboard' | 'list' | 'teams' | 'team' | 'team-settings') => void
}

export default function AdminPage({ user, token, currentView, onViewChange }: AdminPageProps) {
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

  // Admin-specific navigation
  const adminTabs = [
    { id: 'dashboard', label: '📊 Dashboard', view: 'dashboard' as const },
    { id: 'list', label: '📋 Requests', view: 'list' as const },
    { id: 'teams', label: '🏢 Teams', view: 'teams' as const },
    { id: 'team', label: '👑 Leaders', view: 'team' as const },
    { id: 'team-settings', label: '👥 Users', view: 'team-settings' as const },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation */}
      <div className="bg-white border-b border-slate-200 py-4 px-7">
        <div className="max-w-[1400px] mx-auto flex gap-2.5 flex-wrap">
          {adminTabs.map((tab) => (
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

      {/* Admin Content */}
      <div className="max-w-[1400px] mx-auto p-7">
        {currentView === 'dashboard' && (
          <DashboardRefactored 
            user={user} 
            leaves={leaves} 
            token={token} 
            onLeaveUpdate={handleLeaveUpdate}
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

        {currentView === 'teams' && (
          <TeamManagementRefactored 
            currentUser={user} 
            token={token} 
          />
        )}

        {currentView === 'team' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">👑 Team Leaders Management</h2>
            <UserManagementRefactored 
              currentUser={user} 
              token={token} 
              teams={teams}
            />
          </div>
        )}

        {currentView === 'team-settings' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">👥 Users Management</h2>
            <UserManagementRefactored 
              currentUser={user} 
              token={token} 
              teams={teams}
            />
          </div>
        )}
      </div>
    </div>
  )
}
