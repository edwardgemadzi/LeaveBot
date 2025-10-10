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
import { UserManagementLayout } from './UserManagement'

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
    <UserManagementLayout
      currentUser={currentUser}
      users={usersWithBalances}
      error={error}
      localError={localError}
      showAddModal={showAddModal}
      editingUser={editingUser}
      changingPasswordUser={changingPasswordUser}
      settingsUser={settingsUser}
      token={token}
      onAddUser={() => setShowAddModal(true)}
      onEdit={setEditingUser}
      onSettings={setSettingsUser}
      onChangePassword={setChangingPasswordUser}
      onDelete={handleDeleteUser}
      onCloseAddModal={() => setShowAddModal(false)}
      onCloseEditModal={() => setEditingUser(null)}
      onClosePasswordModal={() => setChangingPasswordUser(null)}
      onCloseSettingsModal={() => setSettingsUser(null)}
      onAddUserSubmit={handleAddUser}
      onUpdateUserSubmit={handleUpdateUser}
      onChangePasswordSubmit={handleChangePassword}
      onRefetch={refetch}
      canManageUser={canManageUser}
    />
  )
}
