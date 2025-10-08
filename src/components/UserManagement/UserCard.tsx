/**
 * User card component for displaying individual user information
 */

import { User } from '../../types'
import { getRoleColor, getRoleIcon, formatLeaveBalance } from '../../utils/userHelpers'

interface UserCardProps {
  user: User
  currentUser: User
  canManage: boolean
  onEdit: () => void
  onSettings: () => void
  onChangePassword: () => void
  onDelete: () => void
}

export default function UserCard({
  user,
  currentUser,
  canManage,
  onEdit,
  onSettings,
  onChangePassword,
  onDelete,
}: UserCardProps) {
  const roleColor = getRoleColor(user.role)
  const roleIcon = getRoleIcon(user.role)
  const isCurrentUser =
    user.id === currentUser.id || user._id?.toString() === currentUser.id
  const leaveBalance = formatLeaveBalance(user.leaveBalance)

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: isCurrentUser ? '2px solid #3b82f6' : '1px solid #e5e7eb',
        position: 'relative',
      }}
    >
      {isCurrentUser && (
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
          YOU
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>
          {roleIcon} {user.name}
        </h3>
        <p
          style={{
            margin: '0 0 8px 0',
            color: '#6b7280',
            fontSize: '14px',
          }}
        >
          @{user.username}
        </p>
        <span
          className={roleColor}
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
          }}
        >
          {user.role}
        </span>
      </div>

      {user.createdAt && (
        <p
          style={{
            fontSize: '12px',
            color: '#9ca3af',
            marginBottom: '15px',
          }}
        >
          Joined {new Date(user.createdAt).toLocaleDateString()}
        </p>
      )}

      {/* Leave Balance - Only show for regular users */}
      {user.role === 'user' && user.leaveBalance && (
        <div
          style={{
            padding: '12px',
            background:
              user.leaveBalance.remaining < 5 ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${
              user.leaveBalance.remaining < 5 ? '#fecaca' : '#bbf7d0'
            }`,
            borderRadius: '8px',
            marginBottom: '15px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                color: '#6b7280',
                fontWeight: '600',
              }}
            >
              Leave Balance
            </span>
            <span
              className={leaveBalance.color}
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
              }}
            >
              {user.leaveBalance.remaining}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '15px',
              fontSize: '12px',
              color: '#6b7280',
            }}
          >
            <div>
              <span style={{ fontWeight: '500' }}>Total:</span>{' '}
              {user.leaveBalance.total}
            </div>
            <div>
              <span style={{ fontWeight: '500' }}>Used:</span>{' '}
              {user.leaveBalance.used}
            </div>
          </div>
          {user.leaveBalance.remaining < 5 && (
            <div
              style={{
                marginTop: '8px',
                fontSize: '11px',
                color: '#dc2626',
                fontWeight: '500',
              }}
            >
              ⚠️ Low balance
            </div>
          )}
        </div>
      )}

      {canManage && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
          <button
            onClick={onChangePassword}
            style={{
              padding: '8px 12px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            🔑 Password
          </button>
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
        </div>
      )}
    </div>
  )
}
