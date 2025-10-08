/**
 * Modal for changing user password
 */

import { useState } from 'react'
import { User } from '../../types'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
  onSubmit: (userId: string, password: string) => Promise<{ success: boolean; error?: string }>
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  user,
  onSubmit,
}: ChangePasswordModalProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setError('')

    const result = await onSubmit(user.id || user._id!, password)

    if (result.success) {
      setPassword('')
      onClose()
    } else {
      setError(result.error || 'Failed to change password')
    }

    setLoading(false)
  }

  const handleClose = () => {
    if (!loading) {
      setPassword('')
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
          Change Password for: {user.name}
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

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: '#374151',
              fontWeight: '500',
            }}
          >
            New Password (min 8 characters)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            disabled={loading}
            minLength={8}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
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
            disabled={loading || password.length < 8}
            style={{
              padding: '10px 20px',
              background:
                loading || password.length < 8 ? '#9ca3af' : '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor:
                loading || password.length < 8
                  ? 'not-allowed'
                  : 'pointer',
              fontWeight: '500',
            }}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  )
}
