/**
 * Modal for adding new users
 */

import { useState } from 'react'

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userData: {
    username: string
    password: string
    name: string
    role: 'admin' | 'leader' | 'user'
  }) => Promise<{ success: boolean; error?: string }>
  currentUserRole: 'admin' | 'leader' | 'user'
}

export default function AddUserModal({
  isOpen,
  onClose,
  onSubmit,
  currentUserRole,
}: AddUserModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'user' as 'admin' | 'leader' | 'user',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async () => {
    // Validation
    if (!formData.username || !formData.password || !formData.name) {
      setError('All fields are required')
      return
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setError('')

    const result = await onSubmit(formData)

    if (result.success) {
      setFormData({ username: '', password: '', name: '', role: 'user' })
      onClose()
    } else {
      setError(result.error || 'Failed to create user')
    }

    setLoading(false)
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({ username: '', password: '', name: '', role: 'user' })
      setError('')
      onClose()
    }
  }

  const isValid = formData.username.length >= 3 && 
                  formData.password.length >= 8 && 
                  formData.name.length > 0

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
        <h3 style={{ marginTop: 0, color: '#1f2937' }}>➕ Add New User</h3>

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
            Username *
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            placeholder="Enter username (min 3 characters)"
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

        <div style={{ marginBottom: '15px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: '#374151',
              fontWeight: '500',
            }}
          >
            Full Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter full name"
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

        <div style={{ marginBottom: '15px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: '#374151',
              fontWeight: '500',
            }}
          >
            Password *
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            placeholder="Enter password (min 8 characters)"
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
            Role *
          </label>
          <select
            value={formData.role}
            onChange={(e) =>
              setFormData({
                ...formData,
                role: e.target.value as 'admin' | 'leader' | 'user',
              })
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
            <option value="user">User (Regular Team Member)</option>
            {currentUserRole === 'admin' && (
              <>
                <option value="leader">Leader (Can manage users)</option>
                <option value="admin">Admin (Full access)</option>
              </>
            )}
          </select>
          {currentUserRole === 'leader' && (
            <p
              style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '4px',
              }}
            >
              Leaders can only add regular team members
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
            disabled={loading || !isValid}
            style={{
              padding: '10px 20px',
              background:
                loading || !isValid ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor:
                loading || !isValid ? 'not-allowed' : 'pointer',
              fontWeight: '500',
            }}
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  )
}
