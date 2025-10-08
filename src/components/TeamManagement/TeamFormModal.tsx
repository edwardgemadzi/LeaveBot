/**
 * Modal for creating or editing teams
 */

import { useState, useEffect } from 'react'
import { Team, User } from '../../types'

interface TeamFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (teamData: {
    name: string
    description: string
    leaderId?: string
  }) => Promise<{ success: boolean; error?: string }>
  team?: Team // If provided, it's edit mode
  leaders: User[]
  mode: 'create' | 'edit'
}

export default function TeamFormModal({
  isOpen,
  onClose,
  onSubmit,
  team,
  leaders,
  mode,
}: TeamFormModalProps) {
  const [name, setName] = useState(team?.name || '')
  const [description, setDescription] = useState(team?.description || '')
  const [leaderId, setLeaderId] = useState(team?.leaderId || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (team) {
      setName(team.name)
      setDescription(team.description || '')
      setLeaderId(team.leaderId)
    } else {
      setName('')
      setDescription('')
      setLeaderId('')
    }
  }, [team, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Team name is required')
      return
    }

    setLoading(true)
    setError('')

    const result = await onSubmit({
      name: name.trim(),
      description: description.trim(),
      leaderId: leaderId || undefined,
    })

    if (result.success) {
      handleClose()
    } else {
      setError(result.error || `Failed to ${mode} team`)
    }

    setLoading(false)
  }

  const handleClose = () => {
    if (!loading) {
      setName('')
      setDescription('')
      setLeaderId('')
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
          {mode === 'create' ? '➕ Create New Team' : '✏️ Edit Team'}
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#374151',
                fontWeight: '500',
              }}
            >
              Team Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name"
              disabled={loading}
              required
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
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter team description (optional)"
              disabled={loading}
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'vertical',
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
              Team Leader
            </label>
            <select
              value={leaderId}
              onChange={(e) => setLeaderId(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <option value="">Select a leader (optional)</option>
              {leaders.map((leader) => (
                <option key={leader.id || leader._id} value={leader.id || leader._id}>
                  {leader.name} (@{leader.username})
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
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
              type="submit"
              disabled={loading || !name.trim()}
              style={{
                padding: '10px 20px',
                background:
                  loading || !name.trim() ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor:
                  loading || !name.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '500',
              }}
            >
              {loading
                ? mode === 'create'
                  ? 'Creating...'
                  : 'Saving...'
                : mode === 'create'
                ? 'Create Team'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
