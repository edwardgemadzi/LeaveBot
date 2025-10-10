/**
 * Dedicated User Page Component
 * Contains all user-specific functionality
 */

import React, { useState } from 'react'
import { User, Team, Leave } from '../types'
import { useLeaves } from '../hooks/useLeaves'
import { useToast } from '../hooks/useToast'
import { LeaveListView } from './App/LeaveListView'
import DashboardRefactored from './DashboardRefactored'
import LeaveCalendar from './InteractiveCalendar'
import UserProfileModal from './UserProfileModal'

interface UserPageProps {
  user: User
  token: string
  currentView: 'dashboard' | 'calendar' | 'list'
  onViewChange: (view: 'dashboard' | 'calendar' | 'list') => void
}

export default function UserPage({ user, token, currentView, onViewChange }: UserPageProps) {
  const { leaves, loading: leavesLoading, error: leavesError, refetch: refetchLeaves } = useLeaves(token)
  const { showToast, showError } = useToast()
  const [showUserProfile, setShowUserProfile] = useState(false)

  const handleLeaveUpdate = async () => {
    await refetchLeaves()
    showToast('Leave request updated successfully!')
  }

  // User-specific navigation
  const userTabs = [
    { id: 'dashboard', label: '📊 Dashboard', view: 'dashboard' as const },
    { id: 'calendar', label: '📅 Calendar', view: 'calendar' as const },
    { id: 'list', label: '📋 Request History', view: 'list' as const },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* User Navigation */}
      <div className="bg-white border-b border-slate-200 py-4 px-7">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="flex gap-2.5 flex-wrap">
            {userTabs.map((tab) => (
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

          {/* User Settings Button */}
          <button
            onClick={() => setShowUserProfile(true)}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* User Content */}
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
      </div>

      {/* User Profile Modal */}
      {showUserProfile && (
        <UserProfileModal
          user={user}
          token={token}
          onClose={() => setShowUserProfile(false)}
          onSuccess={() => {
            setShowUserProfile(false)
            showToast('Profile updated successfully!')
          }}
        />
      )}
    </div>
  )
}
