/**
 * Refactored User Management Component
 * Manages users with CRUD operations
 */

import { useState, useEffect } from 'react'
import { User } from '../types'
import { useUsers } from '../hooks/useUsers'
import { useUserOperations } from '../hooks/useUserOperations'
import { useLeaveBalances } from '../hooks/useLeaveBalances'
import { canManageUser } from '../utils/userHelpers'
import UserCard from './UserManagement/UserCard'
import AddUserModal from './UserManagement/AddUserModal'
import EditUserModal from './UserManagement/EditUserModal'
import ChangePasswordModal from './UserManagement/ChangePasswordModal'
import UserProfileModal from './UserProfileModal'

interface UserManagementProps {
  currentUser: User
  token: string
}

export default function UserManagement({
  currentUser,
  token,
}: UserManagementProps) {
  const { users, loading, error, refetch } = useUsers(token)
  const { updateUser, deleteUser, changePassword, createUser } = useUserOperations(token)
  const { loadLeaveBalances } = useLeaveBalances(token, currentUser)

  const [usersWithBalances, setUsersWithBalances] = useState<User[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [changingPasswordUser, setChangingPasswordUser] = useState<User | null>(null)
  const [settingsUser, setSettingsUser] = useState<User | null>(null)
  const [localError, setLocalError] = useState('')

  // Load users with leave balances
  useEffect(() => {
    if (users.length > 0) {
      loadBalances()
    }
  }, [users])

  const loadBalances = async () => {
    const withBalances = await loadLeaveBalances(users)
    setUsersWithBalances(withBalances)
  }

  const handleAddUser = async (userData: {
    username: string
    password: string
    name: string
    role: 'admin' | 'leader' | 'user'
  }) => {
    const result = await createUser(userData)
    if (result.success) {
      await refetch()
      return { success: true }
    }
    return { success: false, error: result.error }
  }

  const handleUpdateUser = async (
    userId: string,
    data: { name: string; role: 'admin' | 'leader' | 'user' }
  ) => {
    const result = await updateUser(userId, data)
    if (result.success) {
      await refetch()
      return { success: true }
    }
    return { success: false, error: result.error }
  }

  const handleDeleteUser = async (user: User) => {
    if (
      !confirm(
        `Are you sure you want to delete ${user.name}? This will also delete all their leave requests.`
      )
    ) {
      return
    }

    const result = await deleteUser(user.id || user._id!)
    if (result.success) {
      alert('User deleted successfully!')
      await refetch()
    } else {
      setLocalError(result.error || 'Failed to delete user')
    }
  }

  const handleChangePassword = async (userId: string, password: string) => {
    const result = await changePassword(userId, password)
    if (result.success) {
      alert('Password updated successfully!')
      return { success: true }
    }
    return { success: false, error: result.error }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading users...</p>
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
            👥 Team Management
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            {currentUser.role === 'admin'
              ? 'You can manage all team members and leaders, and add new users'
              : 'You can manage and add team members to your team'}
          </p>
        </div>

        {/* Add User Button */}
        {(currentUser.role === 'admin' || currentUser.role === 'leader') && (
          <button
            onClick={() => setShowAddModal(true)}
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
            Add {currentUser.role === 'leader' ? 'Team Member' : 'User'}
          </button>
        )}
      </div>

      {/* Error Display */}
      {(error || localError) && (
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
          {error || localError}
        </div>
      )}

      {/* Users Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        {usersWithBalances.map((user) => (
          <UserCard
            key={user.id || user._id}
            user={user}
            currentUser={currentUser}
            canManage={canManageUser(currentUser, user)}
            onEdit={() => setEditingUser(user)}
            onSettings={() => setSettingsUser(user)}
            onChangePassword={() => setChangingPasswordUser(user)}
            onDelete={() => handleDeleteUser(user)}
          />
        ))}
      </div>

      {usersWithBalances.length === 0 && !loading && (
        <p
          style={{
            textAlign: 'center',
            color: '#9ca3af',
            padding: '40px',
          }}
        >
          No users found
        </p>
      )}

      {/* Modals */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddUser}
        currentUserRole={currentUser.role}
      />

      {editingUser && (
        <EditUserModal
          isOpen={true}
          onClose={() => setEditingUser(null)}
          user={editingUser}
          onSubmit={handleUpdateUser}
          currentUserRole={currentUser.role}
        />
      )}

      {changingPasswordUser && (
        <ChangePasswordModal
          isOpen={true}
          onClose={() => setChangingPasswordUser(null)}
          user={changingPasswordUser}
          onSubmit={handleChangePassword}
        />
      )}

      {settingsUser && (
        <UserProfileModal
          isOpen={true}
          onClose={() => setSettingsUser(null)}
          user={settingsUser}
          token={token}
          onSuccess={() => {
            refetch()
            setSettingsUser(null)
          }}
        />
      )}
    </div>
  )
}
