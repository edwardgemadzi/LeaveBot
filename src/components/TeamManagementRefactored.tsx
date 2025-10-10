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
import { TeamManagementLayout } from './TeamManagement'
import TeamTokenModal from './TeamManagement/TeamTokenModal'

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
  const [tokenTeam, setTokenTeam] = useState<Team | null>(null)
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

    const result = await updateTeam(editingTeam.id || editingTeam._id, teamData)
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

    const result = await deleteTeam(team.id || team._id)
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
    <TeamManagementLayout
      currentUser={currentUser}
      teams={teams}
      teamsError={teamsError}
      localError={localError}
      showCreateModal={showCreateModal}
      editingTeam={editingTeam}
      membersTeam={membersTeam}
      settingsTeam={settingsTeam}
      leaders={leaders}
      users={users}
      token={token}
      onCreateTeam={() => setShowCreateModal(true)}
      onEdit={setEditingTeam}
      onSettings={setSettingsTeam}
      onViewMembers={setMembersTeam}
      onDelete={handleDeleteTeam}
      onGenerateToken={setTokenTeam}
      onCloseCreateModal={() => setShowCreateModal(false)}
      onCloseEditModal={() => setEditingTeam(null)}
      onCloseMembersModal={() => setMembersTeam(null)}
      onCloseSettingsModal={() => setSettingsTeam(null)}
      onCloseTokenModal={() => setTokenTeam(null)}
      onCreateTeamSubmit={handleCreateTeam}
      onUpdateTeamSubmit={handleUpdateTeam}
      onAssignUser={handleAssignUser}
      onRemoveUser={handleRemoveUser}
      onRefetchTeams={refetchTeams}
      canEditTeam={canEditTeam}
    />

    {/* Team Token Modal */}
    {tokenTeam && (
      <TeamTokenModal
        isOpen={true}
        onClose={() => setTokenTeam(null)}
        team={tokenTeam}
        token={token}
      />
    )}
  )
}
