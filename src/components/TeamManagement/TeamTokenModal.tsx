/**
 * Modal for generating and displaying team registration tokens
 */

import { useState } from 'react'
import { api } from '../../utils/api'

interface TeamTokenModalProps {
  isOpen: boolean
  onClose: () => void
  team: {
    _id: string
    id?: string
    name: string
  }
  token: string
}

export default function TeamTokenModal({
  isOpen,
  onClose,
  team,
  token,
}: TeamTokenModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [teamToken, setTeamToken] = useState('')
  const [teamName, setTeamName] = useState('')
  const [expiresIn, setExpiresIn] = useState('')

  if (!isOpen) return null

  const handleGenerateToken = async () => {
    setLoading(true)
    setError('')

    try {
      const teamId = team._id || team.id
      const result = await api.teams.generateToken(teamId, token)
      
      if (result.success) {
        setTeamToken(result.teamToken)
        setTeamName(result.teamName)
        setExpiresIn(result.expiresIn)
      } else {
        setError(result.error || 'Failed to generate team token')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyToken = () => {
    navigator.clipboard.writeText(teamToken)
    // You could add a toast notification here
  }

  const handleClose = () => {
    setTeamToken('')
    setTeamName('')
    setExpiresIn('')
    setError('')
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
          maxWidth: '600px',
          width: '90%',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, color: '#1f2937' }}>
          🔑 Generate Team Registration Token
        </h3>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: '#6b7280', marginBottom: '15px' }}>
            Generate a secure token that allows new users to register and join the <strong>{team.name}</strong> team.
          </p>
          
          <div style={{ 
            background: '#f3f4f6', 
            padding: '15px', 
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
              <strong>How it works:</strong>
            </p>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '14px', color: '#374151' }}>
              <li>Share this token with new team members</li>
              <li>They can use it during registration to join your team</li>
              <li>Token expires in 30 days for security</li>
            </ul>
          </div>
        </div>

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

        {!teamToken ? (
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={handleGenerateToken}
              disabled={loading}
              style={{
                background: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                width: '100%',
              }}
            >
              {loading ? 'Generating...' : 'Generate Team Token'}
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#374151',
                  fontWeight: '500',
                }}
              >
                Team Registration Token
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={teamToken}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: '#f9fafb',
                    fontFamily: 'monospace',
                  }}
                />
                <button
                  onClick={handleCopyToken}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Copy
                </button>
              </div>
            </div>

            <div style={{ 
              background: '#ecfdf5', 
              padding: '12px', 
              borderRadius: '8px',
              border: '1px solid #d1fae5'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#065f46' }}>
                <strong>✅ Token Generated Successfully!</strong>
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#047857' }}>
                Team: {teamName} | Expires: {expiresIn}
              </p>
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={handleClose}
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
