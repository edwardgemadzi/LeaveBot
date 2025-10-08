/**
 * Refactored Team Management Component
 * Manages teams with CRUD operations
 */

import { useState, useEffect } from 'react'
import { User, Team } from '../types'
import { useTeams } from '../hooks/useTeams'
import { useUsers } from '../hooks/useUsers'
import { useTeamOperations } from '../hooks/useTeamOperations'
import { canManageTeams, canEditTeam, getAvailableLeaders } from '../utils/teamHelpers'
import TeamCard from './TeamManagement/TeamCard'
import TeamFormModal from './TeamManagement/TeamFormModal'
import TeamMembersModal from './TeamManagement/TeamMembersModal'
import TeamSettingsModal from './TeamSettingsModal'

interface TeamManagementProps {
  currentUser: User
  token: string
}

export default function TeamManagement({
  currentUser,
  token,
}: TeamManagementProps) {
  const { teams, loading: teamsLoading, error: teamsError, refetch: refetchTeams } = useTeams(token)
  const { users, loading: usersLoading } = useUsers(token)
  const {
    createTeam,
    updateTeam,
    deleteTeam,
    assignUserToTeam,
    removeUserFromTeam,
  } = useTeamOperations(token)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [membersTeam, setMembersTeam] = useState<Team | null>(null)
  const [settingsTeam, setSettingsTeam] = useState<Team | null>(null)
  const [localError, setLocalError] = useState('')

  const leaders = getAvailableLeaders(users)

  const handleCreateTeam = async (teamData: {
    name: string
    description: string
    leaderId?: string
  }) => {
    const result = await createTeam(teamData)
    if (result.success) {
      await refetchTeams()
      return { success: true }
    }
    return { success: false, error: result.error }
  }

  const handleUpdateTeam = async (teamData: {
    name: string
    description: string
    leaderId?: string
  }) => {
    if (!editingTeam) return { success: false, error: 'No team selected' }

    const result = await updateTeam(editingTeam._id, teamData)
    if (result.success) {
      await refetchTeams()
      setEditingTeam(null)
      return { success: true }
    }
    return { success: false, error: result.error }
  }

  const handleDeleteTeam = async (team: Team) => {
    if (
      !confirm(
        `Are you sure you want to delete ${team.name}? All members will be unassigned.`
      )
    ) {
      return
    }

    const result = await deleteTeam(team._id)
    if (result.success) {
      alert('Team deleted successfully!')
      await refetchTeams()
    } else {
      setLocalError(result.error || 'Failed to delete team')
    }
  }

  const handleAssignUser = async (teamId: string, userId: string) => {
    const result = await assignUserToTeam(teamId, userId)
    if (result.success) {
      await refetchTeams()
      return { success: true }
    }
    return { success: false, error: result.error }
  }

  const handleRemoveUser = async (teamId: string, userId: string) => {
    const result = await removeUserFromTeam(teamId, userId)
    if (result.success) {
      await refetchTeams()
      return { success: true }
    }
    return { success: false, error: result.error }
  }

  if (!canManageTeams(currentUser)) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>
          You don't have permission to manage teams.
        </p>
      </div>
    )
  }

  if (teamsLoading || usersLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading teams...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div
        style={{
          marginBottom: '30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ color: '#333', marginBottom: '10px' }}>
            🏢 Team Management
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            {currentUser.role === 'admin'
              ? 'Manage all teams, assign leaders, and organize members'
              : 'Manage your team and its members'}
          </p>
        </div>

        {/* Create Team Button - Admin only */}
        {currentUser.role === 'admin' && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '12px 20px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = '#059669')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = '#10b981')
            }
          >
            <span style={{ fontSize: '18px' }}>➕</span>
            Create Team
          </button>
        )}
      </div>

      {/* Error Display */}
      {(teamsError || localError) && (
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
          {teamsError || localError}
        </div>
      )}

      {/* Teams Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        {teams.map((team) => (
          <TeamCard
            key={team._id}
            team={team}
            currentUser={currentUser}
            canEdit={canEditTeam(currentUser, team)}
            onEdit={() => setEditingTeam(team)}
            onSettings={() => setSettingsTeam(team)}
            onViewMembers={() => setMembersTeam(team)}
            onDelete={() => handleDeleteTeam(team)}
          />
        ))}
      </div>

      {teams.length === 0 && !teamsLoading && (
        <p
          style={{
            textAlign: 'center',
            color: '#9ca3af',
            padding: '40px',
          }}
        >
          No teams found. Create your first team to get started!
        </p>
      )}

      {/* Modals */}
      <TeamFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTeam}
        leaders={leaders}
        mode="create"
      />

      {editingTeam && (
        <TeamFormModal
          isOpen={true}
          onClose={() => setEditingTeam(null)}
          onSubmit={handleUpdateTeam}
          team={editingTeam}
          leaders={leaders}
          mode="edit"
        />
      )}

      {membersTeam && (
        <TeamMembersModal
          isOpen={true}
          onClose={() => setMembersTeam(null)}
          team={membersTeam}
          token={token}
          allUsers={users}
          onAssignUser={handleAssignUser}
          onRemoveUser={handleRemoveUser}
          canManage={canEditTeam(currentUser, membersTeam)}
        />
      )}

      {settingsTeam && (
        <TeamSettingsModal
          isOpen={true}
          onClose={() => setSettingsTeam(null)}
          team={settingsTeam as any}
          token={token}
          onSuccess={() => {
            refetchTeams()
            setSettingsTeam(null)
          }}
        />
      )}
    </div>
  )
}
