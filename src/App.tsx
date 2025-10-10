/**
 * Refactored Main Application Component
 * Orchestrates authentication, routing, and main views
 */

import React, { useState, useEffect, useMemo } from 'react'
import './App.css'
import { useAuth } from './hooks/useAuth'
import { useLeaves } from './hooks/useLeaves'
import { useUsers } from './hooks/useUsers'
import { useToast } from './hooks/useToast'
import Authentication from './components/Auth/Authentication'
import { AppLayout } from './components/App'
import { useUserSettings } from './hooks/useUserSettings'
import { useTeamMembers } from './hooks/useTeamMembers'
import { useAutoRefresh } from './hooks/useAutoRefresh'

type View = 'dashboard' | 'calendar' | 'list' | 'team' | 'teams' | 'team-settings'

function App() {
  const { user, token, loading: authLoading, error: authError, login, register, logout, isAuthenticated } = useAuth()
  const { leaves, loading: leavesLoading, updateLeaveStatus, refetch: refetchLeaves } = useLeaves(token, isAuthenticated)
  const { users } = useUsers(token, false)
  const { toasts, success, error: showError, closeToast } = useToast()

  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [searchFilter, setSearchFilter] = useState({ search: '', status: '' })
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const { settings: userSettings } = useUserSettings(user?.id, token)
  // Remove requestDates state - no longer needed

  // Auto-refresh leaves every 30 seconds
  useAutoRefresh(refetchLeaves, isAuthenticated, 30000)

  // Load team members for admins/leaders
  const { members } = useTeamMembers(token, !!user && (user.role === 'admin' || user.role === 'leader'))
  useEffect(() => { setTeamMembers(members as any[]) }, [members])

  // Filter leaves based on search, status, and user role
  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      // For regular users, only show their own requests
      if (user?.role === 'user' && leave.userId !== user.id) {
        return false
      }

      const matchesSearch =
        !searchFilter.search ||
        leave.employeeName.toLowerCase().includes(searchFilter.search.toLowerCase()) ||
        (leave.reason && leave.reason.toLowerCase().includes(searchFilter.search.toLowerCase()))

      const matchesStatus = !searchFilter.status || leave.status === searchFilter.status

      return matchesSearch && matchesStatus
    })
  }, [leaves, searchFilter, user])

  const handleStatusUpdate = async (leaveId: string, status: 'approved' | 'rejected') => {
    const result = await updateLeaveStatus(leaveId, status)
    if (result.success) {
      success(`Leave ${status} successfully!`)
    } else {
      showError(result.error || `Failed to ${status} leave`)
    }
  }

  // Show loading during initial auth check
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    )
  }

  // Show authentication if not logged in
  if (!isAuthenticated) {
    return (
      <Authentication
        onLogin={login}
        onRegister={register}
        loading={authLoading}
        error={authError}
      />
    )
  }

  const isAdmin = user!.role === 'admin' || user!.role === 'leader'

  return (
    <AppLayout
      user={user!}
      currentView={currentView}
      leaves={leaves}
      filteredLeaves={filteredLeaves}
      leavesLoading={leavesLoading}
      isAdmin={isAdmin}
      teamMembers={teamMembers}
      userSettings={userSettings}
      searchFilter={searchFilter}
      showProfileSettings={showProfileSettings}
      toasts={toasts}
      onViewChange={setCurrentView}
      onSettingsClick={() => setShowProfileSettings(true)}
      onLogout={logout}
      onLeaveUpdate={refetchLeaves}
      onRequestLeave={() => {}} // Will be handled by calendar popup
      onStatusUpdate={handleStatusUpdate}
      onFilterChange={setSearchFilter}
      onCloseProfileSettings={() => setShowProfileSettings(false)}
      onCloseToast={closeToast}
      showToast={success}
      showError={showError}
      token={token}
    />
  )
}

export default App
