import { useState, useEffect } from 'react'
import { User, Plus, Trash2, Eye, EyeOff, X, Shield, Users as UsersIcon, UserCog } from 'lucide-react'
import UserProfileModal from './UserProfileModal'

interface User {
  id: string
  _id?: string
  username: string
  name: string
  role: 'admin' | 'leader' | 'user'
  createdAt: string
  leaveBalance?: {
    total: number
    used: number
    remaining: number
  }
}

interface UserManagementProps {
  currentUser: User
  token: string
}

export default function UserManagement({ currentUser, token }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<'admin' | 'leader' | 'user'>('user')
  const [newPassword, setNewPassword] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [changingPasswordFor, setChangingPasswordFor] = useState<User | null>(null)
  const [editingUserSettings, setEditingUserSettings] = useState<User | null>(null)
  
  // Add User states
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [addUserData, setAddUserData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'user' as 'admin' | 'leader' | 'user'
  })
  const [addingUser, setAddingUser] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()

      if (res.status === 401 || res.status === 403) {
        setError(data.error || 'Access denied')
        return
      }

      if (data.success) {
        setUsers(data.users)
        // Load leave balances for each user
        await loadLeaveBalances(data.users)
      } else {
        setError(data.error || 'Failed to load users')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function loadLeaveBalances(userList: User[]) {
    try {
      // Fetch team settings to get annual leave days
      let annualLeaveDays = 21 // Default
      
      if (currentUser.role === 'leader') {
        // Get leader's team settings
        const teamsRes = await fetch('/api/teams', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const teamsData = await teamsRes.json()
        const leaderTeam = Array.isArray(teamsData) ? teamsData[0] : teamsData.teams?.[0]
        
        if (leaderTeam?._id) {
          const settingsRes = await fetch(`/api/teams?id=${leaderTeam._id}&action=settings`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          const settingsData = await settingsRes.json()
          if (settingsData.settings?.annualLeaveDays) {
            annualLeaveDays = settingsData.settings.annualLeaveDays
          }
        }
      }
      
      // Fetch leaves for all users
      const res = await fetch('/api/leaves', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      
      if (res.ok && data.leaves) {
        // Calculate balance for each user
        const usersWithBalance = userList.map(user => {
          const userLeaves = data.leaves.filter((leave: any) => 
            leave.userId === user.id && leave.status === 'approved'
          )
          
          const usedDays = userLeaves.reduce((sum: number, leave: any) => 
            sum + (leave.workingDaysCount || 0), 0
          )
          
          return {
            ...user,
            leaveBalance: {
              total: annualLeaveDays,
              used: usedDays,
              remaining: annualLeaveDays - usedDays
            }
          }
        })
        
        setUsers(usersWithBalance)
      }
    } catch (err) {
      console.error('Failed to load leave balances:', err)
    }
  }

  async function handleUpdateUser() {
    if (!editingUser) return

    setError('')
    try {
      const res = await fetch(`/api/users?id=${editingUser.id || editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          role: editRole
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert('User updated successfully!')
        setEditingUser(null)
        loadUsers()
      } else {
        setError(data.error || 'Failed to update user')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }
  }

  async function handleDeleteUser(user: User) {
    if (!confirm(`Are you sure you want to delete ${user.name}? This will also delete all their leave requests.`)) {
      return
    }

    setError('')
    try {
      const res = await fetch(`/api/users?id=${user.id || user._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert('User deleted successfully!')
        loadUsers()
      } else {
        setError(data.error || 'Failed to delete user')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }
  }

  async function handleChangePassword() {
    if (!changingPasswordFor) return

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setError('')
    try {
      const res = await fetch('/api/users?action=password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          userId: changingPasswordFor.id || changingPasswordFor._id,
          newPassword 
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert('Password updated successfully!')
        setShowPasswordModal(false)
        setChangingPasswordFor(null)
        setNewPassword('')
      } else {
        setError(data.error || 'Failed to update password')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }
  }

  async function handleAddUser() {
    if (!addUserData.username || !addUserData.password || !addUserData.name) {
      setError('All fields are required')
      return
    }

    if (addUserData.username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    if (addUserData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setError('')
    setAddingUser(true)
    try {
      const res = await fetch('/api/users?action=create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addUserData)
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert(`User ${addUserData.name} created successfully!`)
        setShowAddUserModal(false)
        setAddUserData({ username: '', password: '', name: '', role: 'user' })
        loadUsers()
      } else {
        setError(data.error || 'Failed to create user')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setAddingUser(false)
    }
  }

  function canManageUser(user: User): boolean {
    if (currentUser.role === 'admin') {
      // Admins can manage everyone except themselves
      return user.id !== currentUser.id && user._id?.toString() !== currentUser.id
    }
    if (currentUser.role === 'leader') {
      // Leaders can only manage regular users
      return user.role === 'user'
    }
    return false
  }

  function getRoleColor(role: string) {
    switch (role) {
      case 'admin': return { bg: '#dbeafe', text: '#1e40af' }
      case 'leader': return { bg: '#fef3c7', text: '#92400e' }
      case 'user': return { bg: '#e5e7eb', text: '#374151' }
      default: return { bg: '#e5e7eb', text: '#374151' }
    }
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
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
        
        {/* Add User Button - Admin and Leader */}
        {(currentUser.role === 'admin' || currentUser.role === 'leader') && (
          <button
            onClick={() => {
              setShowAddUserModal(true)
              setAddUserData({ username: '', password: '', name: '', role: 'user' })
              setError('')
            }}
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
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
          >
            <span style={{ fontSize: '18px' }}>➕</span>
            Add {currentUser.role === 'leader' ? 'Team Member' : 'User'}
          </button>
        )}
      </div>

      {error && (
        <div style={{
          padding: '12px',
          background: '#fee2e2',
          color: '#991b1b',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}

      {/* Users Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {users.map(user => {
          const roleColor = getRoleColor(user.role)
          const isCurrentUser = user.id === currentUser.id || user._id?.toString() === currentUser.id
          const canManage = canManageUser(user)

          return (
            <div
              key={user.id || user._id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: isCurrentUser ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                position: 'relative'
              }}
            >
              {isCurrentUser && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: '#3b82f6',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  YOU
                </div>
              )}

              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>{user.name}</h3>
                <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
                  @{user.username}
                </p>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: roleColor.bg,
                  color: roleColor.text,
                  textTransform: 'uppercase'
                }}>
                  {user.role}
                </span>
              </div>

              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '15px' }}>
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </p>

              {/* Leave Balance - Only show for regular users */}
              {user.role === 'user' && user.leaveBalance && (
                <div style={{
                  padding: '12px',
                  background: user.leaveBalance.remaining < 5 ? '#fef2f2' : '#f0fdf4',
                  border: `1px solid ${user.leaveBalance.remaining < 5 ? '#fecaca' : '#bbf7d0'}`,
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
                      Leave Balance
                    </span>
                    <span style={{ 
                      fontSize: '18px', 
                      fontWeight: 'bold',
                      color: user.leaveBalance.remaining < 5 ? '#dc2626' : '#059669'
                    }}>
                      {user.leaveBalance.remaining}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    gap: '15px', 
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    <div>
                      <span style={{ fontWeight: '500' }}>Total:</span> {user.leaveBalance.total}
                    </div>
                    <div>
                      <span style={{ fontWeight: '500' }}>Used:</span> {user.leaveBalance.used}
                    </div>
                  </div>
                  {user.leaveBalance.remaining < 5 && (
                    <div style={{ 
                      marginTop: '8px', 
                      fontSize: '11px', 
                      color: '#dc2626',
                      fontWeight: '500'
                    }}>
                      ⚠️ Low balance
                    </div>
                  )}
                </div>
              )}

              {canManage && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setEditingUser(user)
                      setEditName(user.name)
                      setEditRole(user.role)
                      setError('')
                    }}
                    style={{
                      padding: '8px 12px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => setEditingUserSettings(user)}
                    style={{
                      padding: '8px 12px',
                      background: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    ⚙️ Settings
                  </button>
                  <button
                    onClick={() => {
                      setChangingPasswordFor(user)
                      setShowPasswordModal(true)
                      setNewPassword('')
                      setError('')
                    }}
                    style={{
                      padding: '8px 12px',
                      background: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    🔑 Password
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user)}
                    style={{
                      padding: '8px 12px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {users.length === 0 && (
        <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
          No users found
        </p>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0, color: '#1f2937' }}>Edit User: {editingUser.name}</h3>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500' }}>
                Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500' }}>
                Role
              </label>
              <select
                value={editRole}
                onChange={e => setEditRole(e.target.value as 'admin' | 'leader' | 'user')}
                disabled={currentUser.role === 'leader'}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: currentUser.role === 'leader' ? '#f3f4f6' : 'white',
                  cursor: currentUser.role === 'leader' ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="user">User</option>
                <option value="leader">Leader</option>
                {currentUser.role === 'admin' && <option value="admin">Admin</option>}
              </select>
              {currentUser.role === 'leader' && (
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Leaders cannot change user roles
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setEditingUser(null)
                  setError('')
                }}
                style={{
                  padding: '10px 20px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                style={{
                  padding: '10px 20px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && changingPasswordFor && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0, color: '#1f2937' }}>
              Change Password for: {changingPasswordFor.name}
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500' }}>
                New Password (min 8 characters)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                minLength={8}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setChangingPasswordFor(null)
                  setNewPassword('')
                  setError('')
                }}
                style={{
                  padding: '10px 20px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={newPassword.length < 8}
                style={{
                  padding: '10px 20px',
                  background: newPassword.length < 8 ? '#9ca3af' : '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: newPassword.length < 8 ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (currentUser.role === 'admin' || currentUser.role === 'leader') && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0, color: '#1f2937' }}>➕ Add New User</h3>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500' }}>
                Username *
              </label>
              <input
                type="text"
                value={addUserData.username}
                onChange={e => setAddUserData({ ...addUserData, username: e.target.value })}
                placeholder="Enter username (min 3 characters)"
                minLength={3}
                maxLength={50}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500' }}>
                Full Name *
              </label>
              <input
                type="text"
                value={addUserData.name}
                onChange={e => setAddUserData({ ...addUserData, name: e.target.value })}
                placeholder="Enter full name"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500' }}>
                Password *
              </label>
              <input
                type="password"
                value={addUserData.password}
                onChange={e => setAddUserData({ ...addUserData, password: e.target.value })}
                placeholder="Enter password (min 8 characters)"
                minLength={8}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500' }}>
                Role *
              </label>
              <select
                value={addUserData.role}
                onChange={e => setAddUserData({ ...addUserData, role: e.target.value as 'admin' | 'leader' | 'user' })}
                disabled={currentUser.role === 'leader'}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: currentUser.role === 'leader' ? '#f3f4f6' : 'white',
                  cursor: currentUser.role === 'leader' ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="user">User (Regular Team Member)</option>
                {currentUser.role === 'admin' && (
                  <>
                    <option value="leader">Leader (Can manage users)</option>
                    <option value="admin">Admin (Full access)</option>
                  </>
                )}
              </select>
              {currentUser.role === 'leader' && (
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Leaders can only add regular team members
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddUserModal(false)
                  setAddUserData({ username: '', password: '', name: '', role: 'user' })
                  setError('')
                }}
                disabled={addingUser}
                style={{
                  padding: '10px 20px',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: addingUser ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={addingUser || !addUserData.username || !addUserData.password || !addUserData.name}
                style={{
                  padding: '10px 20px',
                  background: (addingUser || !addUserData.username || !addUserData.password || !addUserData.name) ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (addingUser || !addUserData.username || !addUserData.password || !addUserData.name) ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                {addingUser ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Settings Modal */}
      {editingUserSettings && (
        <UserProfileModal
          isOpen={true}
          onClose={() => setEditingUserSettings(null)}
          user={editingUserSettings}
          token={token}
          onSuccess={() => {
            loadUsers()
            setEditingUserSettings(null)
          }}
        />
      )}
    </div>
  )
}
