/**
 * Modal for editing user details
 */

import { useState, useEffect } from 'react'
import { User } from '../../types'

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
  onSubmit: (userId: string, data: { name: string; role: 'admin' | 'leader' | 'user' }) => Promise<{ success: boolean; error?: string }>
  currentUserRole: 'admin' | 'leader' | 'user'
}

export default function EditUserModal({
  isOpen,
  onClose,
  user,
  onSubmit,
  currentUserRole,
}: EditUserModalProps) {
  const [name, setName] = useState(user.name)
  const [role, setRole] = useState(user.role)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setName(user.name)
    setRole(user.role)
  }, [user])

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setLoading(true)
    setError('')

    const result = await onSubmit(user.id || user._id!, { name, role })

    if (result.success) {
      onClose()
    } else {
      setError(result.error || 'Failed to update user')
    }

    setLoading(false)
  }

  const handleClose = () => {
    if (!loading) {
      setError('')
      onClose()
    }
  }

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
      onClick={handleClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, color: '#1f2937' }}>
          Edit User: {user.name}
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

        <div style={{ marginBottom: '15px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: '#374151',
              fontWeight: '500',
            }}
          >
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: '#374151',
              fontWeight: '500',
            }}
          >
            Role
          </label>
          <select
            value={role}
            onChange={(e) =>
              setRole(e.target.value as 'admin' | 'leader' | 'user')
            }
            disabled={loading || currentUserRole === 'leader'}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              background:
                currentUserRole === 'leader' ? '#f3f4f6' : 'white',
              cursor:
                currentUserRole === 'leader' ? 'not-allowed' : 'pointer',
            }}
          >
            <option value="user">User</option>
            <option value="leader">Leader</option>
            {currentUserRole === 'admin' && <option value="admin">Admin</option>}
          </select>
          {currentUserRole === 'leader' && (
            <p
              style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '4px',
              }}
            >
              Leaders cannot change user roles
            </p>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={handleClose}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            style={{
              padding: '10px 20px',
              background:
                loading || !name.trim() ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor:
                loading || !name.trim() ? 'not-allowed' : 'pointer',
              fontWeight: '500',
            }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
