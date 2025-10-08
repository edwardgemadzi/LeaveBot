/**
 * Refactored Main Application Component
 * Orchestrates authentication, routing, and main views
 */

import { useState, useEffect, useMemo } from 'react'
import './App.css'
import { useAuth } from './hooks/useAuth'
import { useLeaves } from './hooks/useLeaves'
import { useUsers } from './hooks/useUsers'
import { useToast } from './hooks/useToast'
import Authentication from './components/Auth/Authentication'
import Dashboard from './components/Dashboard'
import InteractiveCalendar from './components/InteractiveCalendar'
import UserManagementRefactored from './components/UserManagementRefactored'
import TeamManagementRefactored from './components/TeamManagementRefactored'
import TeamLeaveSettings from './components/TeamLeaveSettings'
import UserProfileModal from './components/UserProfileModal'
import LeaveRequestForm from './components/Leaves/LeaveRequestForm'
import LeaveCard from './components/Leaves/LeaveCard'
import NavTab from './components/Navigation/NavTab'
import { ToastContainer } from './components/Toast'
import { EmptyState } from './components/EmptyState'
import { LeaveCardSkeleton } from './components/LoadingSkeleton'
import { SearchFilter } from './components/SearchFilter'

type View = 'dashboard' | 'calendar' | 'list' | 'form' | 'team' | 'teams' | 'team-settings'

function App() {
  const { user, token, loading: authLoading, error: authError, login, register, logout, isAuthenticated } = useAuth()
  const { leaves, loading: leavesLoading, updateLeaveStatus, refetch: refetchLeaves } = useLeaves(token, isAuthenticated)
  const { users } = useUsers(token, false)
  const { toasts, success, error: showError, closeToast } = useToast()

  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [searchFilter, setSearchFilter] = useState({ search: '', status: '' })
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [teamMembers, setTeamMembers] = useState<any[]>([])

  // Auto-refresh leaves every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      refetchLeaves()
    }, 30000)

    return () => clearInterval(interval)
  }, [isAuthenticated, refetchLeaves])

  // Load team members for admins/leaders
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'leader')) {
      loadTeamMembers()
    }
  }, [user, token])

  const loadTeamMembers = async () => {
    if (!token) return

    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      if (data.success) {
        const members = data.users.filter((u: any) => u.role === 'user')
        setTeamMembers(members)
      }
    } catch (err) {
      console.error('Failed to load team members:', err)
    }
  }

  // Filter leaves based on search and status
  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      const matchesSearch =
        !searchFilter.search ||
        leave.employeeName.toLowerCase().includes(searchFilter.search.toLowerCase()) ||
        (leave.reason && leave.reason.toLowerCase().includes(searchFilter.search.toLowerCase()))

      const matchesStatus = !searchFilter.status || leave.status === searchFilter.status

      return matchesSearch && matchesStatus
    })
  }, [leaves, searchFilter])

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
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <ToastContainer toasts={toasts} onClose={closeToast} />

      {/* Header */}
      <div
        style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '20px 30px',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', color: '#1f2937' }}>
              🌴 LeaveBot
            </h1>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
              Welcome back, {user!.name}!
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setShowProfileSettings(true)}
              style={{
                padding: '10px 16px',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              ⚙️ Settings
            </button>
            <button
              onClick={logout}
              style={{
                padding: '10px 16px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div
        style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '15px 30px',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <NavTab
            active={currentView === 'dashboard'}
            onClick={() => setCurrentView('dashboard')}
            icon="📊"
            label="Dashboard"
          />
          <NavTab
            active={currentView === 'calendar'}
            onClick={() => setCurrentView('calendar')}
            icon="📅"
            label="Calendar"
          />
          <NavTab
            active={currentView === 'list'}
            onClick={() => setCurrentView('list')}
            icon="📋"
            label="All Requests"
          />
          <NavTab
            active={currentView === 'form'}
            onClick={() => setCurrentView('form')}
            icon="➕"
            label="New Request"
          />
          {isAdmin && (
            <>
              <NavTab
                active={currentView === 'team'}
                onClick={() => setCurrentView('team')}
                icon="👥"
                label="Team Members"
              />
              <NavTab
                active={currentView === 'teams'}
                onClick={() => setCurrentView('teams')}
                icon="🏢"
                label="Teams"
              />
              <NavTab
                active={currentView === 'team-settings'}
                onClick={() => setCurrentView('team-settings')}
                icon="⚙️"
                label="Team Settings"
              />
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px' }}>
        {currentView === 'dashboard' && (
          <Dashboard
            leaves={leaves}
            user={user!}
            token={token}
            onLeaveUpdate={refetchLeaves}
          />
        )}

        {currentView === 'calendar' && (
          <InteractiveCalendar
            leaves={leaves}
            user={user!}
            token={token}
          />
        )}

        {currentView === 'list' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ margin: 0, color: '#1f2937' }}>📋 All Leave Requests</h2>
            </div>

            <SearchFilter
              onFilterChange={setSearchFilter}
              resultCount={filteredLeaves.length}
            />

            {leavesLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                {[...Array(6)].map((_, i) => (
                  <LeaveCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredLeaves.length === 0 ? (
              <EmptyState
                icon="leaves"
                title="No leave requests found"
                description={
                  searchFilter.search || searchFilter.status
                    ? 'Try adjusting your search filters'
                    : 'Submit your first leave request to get started'
                }
                action={
                  !searchFilter.search && !searchFilter.status
                    ? { label: 'Request Leave', onClick: () => setCurrentView('form') }
                    : undefined
                }
              />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: '20px',
                }}
              >
                {filteredLeaves.map((leave) => (
                  <LeaveCard
                    key={leave._id}
                    leave={leave}
                    isAdmin={isAdmin}
                    onStatusUpdate={handleStatusUpdate}
                    token={token}
                    showToast={success}
                    showError={showError}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'form' && (
          <LeaveRequestForm
            user={user!}
            token={token}
            teamMembers={teamMembers}
            onSuccess={() => {
              refetchLeaves()
              setCurrentView('list')
            }}
            onCancel={() => setCurrentView('dashboard')}
            showToast={success}
            showError={showError}
          />
        )}

        {currentView === 'team' && isAdmin && (
          <UserManagementRefactored currentUser={user!} token={token} />
        )}

        {currentView === 'teams' && isAdmin && (
          <TeamManagementRefactored currentUser={user!} token={token} />
        )}

        {currentView === 'team-settings' && isAdmin && (
          <TeamLeaveSettings user={user!} token={token} />
        )}
      </div>

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <UserProfileModal
          isOpen={true}
          onClose={() => setShowProfileSettings(false)}
          user={user!}
          token={token}
          onSuccess={() => {
            success('Settings updated successfully!')
            setShowProfileSettings(false)
          }}
        />
      )}
    </div>
  )
}

export default App
