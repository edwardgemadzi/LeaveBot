/**
 * Modal for viewing and managing team members
 */

import { useState, useEffect } from 'react'
import { Team, User } from '../../types'
import { api } from '../../utils/api'

interface TeamMembersModalProps {
  isOpen: boolean
  onClose: () => void
  team: Team
  token: string
  allUsers: User[]
  onAssignUser: (teamId: string, userId: string) => Promise<{ success: boolean; error?: string }>
  onRemoveUser: (teamId: string, userId: string) => Promise<{ success: boolean; error?: string }>
  canManage: boolean
}

interface TeamMember {
  _id: string
  username: string
  name: string
  role: string
}

export default function TeamMembersModal({
  isOpen,
  onClose,
  team,
  token,
  allUsers,
  onAssignUser,
  onRemoveUser,
  canManage,
}: TeamMembersModalProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadMembers()
    }
  }, [isOpen, team._id])

  const loadMembers = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await api.teams.getMembers(team._id, token)
      setMembers(data.members || [])
    } catch (err) {
      setError('Failed to load team members')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedUserId) return

    const result = await onAssignUser(team._id, selectedUserId)
    if (result.success) {
      setSelectedUserId('')
      await loadMembers()
    } else {
      setError(result.error || 'Failed to assign user')
    }
  }

  const handleRemove = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member from the team?')) {
      return
    }

    const result = await onRemoveUser(team._id, userId)
    if (result.success) {
      await loadMembers()
    } else {
      setError(result.error || 'Failed to remove user')
    }
  }

  // Get users not in this team
  const availableUsers = allUsers.filter(
    (user) =>
      user.role === 'user' &&
      !members.some((m) => m._id === user.id || m._id === user._id)
  )

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, color: '#1f2937' }}>
          👥 {team.name} - Members
        </h3>

        {error && (
          <div
            style={{
              padding: '12px',
              background: '#fee2e2',
              color: '#991b1b',
              borderRadius: '8px',
              marginBottom: '15px',
              border: '1px solid #fecaca',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {/* Add Member Section */}
        {canManage && availableUsers.length > 0 && (
          <div
            style={{
              padding: '15px',
              background: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          >
            <h4
              style={{
                margin: '0 0 10px 0',
                fontSize: '14px',
                color: '#374151',
              }}
            >
              Add Member
            </h4>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value="">Select a user...</option>
                {availableUsers.map((user) => (
                  <option key={user.id || user._id} value={user.id || user._id}>
                    {user.name} (@{user.username})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssign}
                disabled={!selectedUserId}
                style={{
                  padding: '8px 16px',
                  background: selectedUserId ? '#10b981' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: selectedUserId ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Members List */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
            Loading members...
          </p>
        ) : members.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
            No members in this team yet
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {members.map((member) => (
              <div
                key={member._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', color: '#1f2937' }}>
                    {member.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    @{member.username} • {member.role}
                  </div>
                </div>
                {canManage && (
                  <button
                    onClick={() => handleRemove(member._id)}
                    style={{
                      padding: '6px 12px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
