/**
 * Team card component for displaying individual team information
 */

import { Team, User } from '../../types'
import { getTeamMemberCount, formatTeamDate } from '../../utils/teamHelpers'

interface TeamCardProps {
  team: Team
  currentUser: User
  canEdit: boolean
  onEdit: () => void
  onSettings: () => void
  onViewMembers: () => void
  onDelete: () => void
}

export default function TeamCard({
  team,
  currentUser,
  canEdit,
  onEdit,
  onSettings,
  onViewMembers,
  onDelete,
}: TeamCardProps) {
  const memberCount = getTeamMemberCount(team)
  const isOwnTeam = currentUser.teamId === team._id

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: isOwnTeam ? '2px solid #3b82f6' : '1px solid #e5e7eb',
        position: 'relative',
      }}
    >
      {isOwnTeam && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: '#3b82f6',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
          }}
        >
          YOUR TEAM
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>
          🏢 {team.name}
        </h3>
        {team.description && (
          <p
            style={{
              margin: '0 0 12px 0',
              color: '#6b7280',
              fontSize: '14px',
            }}
          >
            {team.description}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            gap: '15px',
            fontSize: '13px',
            color: '#6b7280',
            marginBottom: '12px',
          }}
        >
          <div>
            <span style={{ fontWeight: '500' }}>Leader:</span>{' '}
            {team.leaderName || 'Unassigned'}
          </div>
          <div>
            <span style={{ fontWeight: '500' }}>Members:</span> {memberCount}
          </div>
        </div>

        {team.createdAt && (
          <p
            style={{
              fontSize: '12px',
              color: '#9ca3af',
              marginBottom: '15px',
            }}
          >
            Created {formatTeamDate(team.createdAt)}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={onViewMembers}
          style={{
            padding: '8px 12px',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
          }}
        >
          👥 Members
        </button>

        {canEdit && (
          <>
            <button
              onClick={onEdit}
              style={{
                padding: '8px 12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              ✏️ Edit
            </button>
            <button
              onClick={onSettings}
              style={{
                padding: '8px 12px',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              ⚙️ Settings
            </button>
            {currentUser.role === 'admin' && (
              <button
                onClick={onDelete}
                style={{
                  padding: '8px 12px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                🗑️ Delete
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
