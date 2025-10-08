import { useState, useEffect } from 'react'

interface TeamLeaveSettingsProps {
  user: any
  token: string
}

export default function TeamLeaveSettings({ user, token }: TeamLeaveSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [teamId, setTeamId] = useState<string | null>(null)
  const [teamSettings, setTeamSettings] = useState({
    annualLeaveDays: 21,
    maxConsecutiveDays: 14,
    minAdvanceNoticeDays: 7,
    allowNegativeBalance: false,
    carryOverDays: 5,
    maxConcurrentLeave: 3 // Max people on leave at the same time
  })

  useEffect(() => {
    loadTeamAndSettings()
  }, [])

  const loadTeamAndSettings = async () => {
    setLoading(true)
    try {
      // First, get the leader's team
      const teamsRes = await fetch('/api/teams', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!teamsRes.ok) {
        console.error('Failed to load team:', teamsRes.status)
        setError('Failed to load your team information')
        return
      }
      
      const teamsData = await teamsRes.json()
      const leaderTeam = Array.isArray(teamsData) ? teamsData[0] : teamsData.teams?.[0]
      
      if (!leaderTeam) {
        setError('You are not assigned to any team')
        return
      }
      
      setTeamId(leaderTeam._id)
      
      // Now load the team settings
      const settingsRes = await fetch(`/api/teams?id=${leaderTeam._id}&action=settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!settingsRes.ok) {
        console.error('Failed to load settings:', settingsRes.status, settingsRes.statusText)
        return
      }
      
      const settingsData = await settingsRes.json()
      
      if (settingsData.settings) {
        setTeamSettings(settingsData.settings)
      }
    } catch (err) {
      console.error('Failed to load team settings:', err)
      setError('Failed to load team settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!teamId) {
      setError('Team ID not found')
      return
    }
    
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      const res = await fetch(`/api/teams?id=${teamId}&action=settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(teamSettings)
      })
      
      if (!res.ok) {
        // Try to parse error message
        try {
          const data = await res.json()
          setError(data.error || `Server error: ${res.status}`)
        } catch {
          setError(`Server error: ${res.status} ${res.statusText}`)
        }
        return
      }
      
      const data = await res.json()
      
      if (data.message || data.success) {
        setSuccess('Team leave settings saved successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to save settings')
      }
    } catch (err: any) {
      console.error('Save error:', err)
      setError(`Network error: ${err.message || 'Please try again.'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
        <p>Loading team settings...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0, color: '#1f2937', marginBottom: '10px' }}>
          ⚙️ Team Leave Settings
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '30px' }}>
          Configure leave policies for your entire team
        </p>

        {error && (
          <div style={{
            padding: '12px',
            background: '#fee',
            color: '#c00',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '12px',
            background: '#d4edda',
            color: '#155724',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            {success}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {/* Annual Leave Days */}
          <div>
            <label style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#374151'
            }}>
              📅 Annual Leave Days per Year
            </label>
            <input
              type="number"
              min="0"
              max="365"
              value={teamSettings.annualLeaveDays}
              onChange={(e) => setTeamSettings({
                ...teamSettings,
                annualLeaveDays: parseInt(e.target.value) || 0
              })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Total annual leave days each team member is entitled to
            </p>
          </div>

          {/* Max Consecutive Days */}
          <div>
            <label style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#374151'
            }}>
              🔢 Maximum Consecutive Days
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={teamSettings.maxConsecutiveDays}
              onChange={(e) => setTeamSettings({
                ...teamSettings,
                maxConsecutiveDays: parseInt(e.target.value) || 1
              })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Maximum number of consecutive days a team member can request
            </p>
          </div>

          {/* Minimum Advance Notice */}
          <div>
            <label style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#374151'
            }}>
              ⏰ Minimum Advance Notice (days)
            </label>
            <input
              type="number"
              min="0"
              max="90"
              value={teamSettings.minAdvanceNoticeDays}
              onChange={(e) => setTeamSettings({
                ...teamSettings,
                minAdvanceNoticeDays: parseInt(e.target.value) || 0
              })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Minimum days in advance a leave request must be submitted
            </p>
          </div>

          {/* Carry Over Days */}
          <div>
            <label style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#374151'
            }}>
              📦 Carry Over Days
            </label>
            <input
              type="number"
              min="0"
              max="30"
              value={teamSettings.carryOverDays}
              onChange={(e) => setTeamSettings({
                ...teamSettings,
                carryOverDays: parseInt(e.target.value) || 0
              })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Maximum unused days that can be carried over to next year
            </p>
          </div>

          {/* Max Concurrent Leave */}
          <div>
            <label style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#374151'
            }}>
              👥 Maximum Concurrent Leave
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={teamSettings.maxConcurrentLeave}
              onChange={(e) => setTeamSettings({
                ...teamSettings,
                maxConcurrentLeave: parseInt(e.target.value) || 1
              })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Maximum number of team members who can be on leave at the same time
            </p>
          </div>

          {/* Allow Negative Balance */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={teamSettings.allowNegativeBalance}
                onChange={(e) => setTeamSettings({
                  ...teamSettings,
                  allowNegativeBalance: e.target.checked
                })}
                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
              />
              <span style={{ fontWeight: '600', color: '#374151' }}>
                💳 Allow Negative Leave Balance
              </span>
            </label>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', marginLeft: '28px' }}>
              Allow team members to go into negative leave balance (borrow from next year)
            </p>
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: saving ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {saving ? '💾 Saving...' : '💾 Save Settings'}
            </button>
          </div>
        </div>
      </div>

      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '20px'
      }}>
        <h3 style={{ marginTop: 0, color: '#1e40af', fontSize: '16px' }}>
          ℹ️ About Team Leave Settings
        </h3>
        <ul style={{ color: '#1e40af', fontSize: '14px', lineHeight: '1.6', margin: '10px 0' }}>
          <li>These settings apply to all team members</li>
          <li>Changes take effect immediately</li>
          <li>Individual shift patterns are set per team member</li>
          <li>Leave balance is calculated automatically based on approved leaves</li>
        </ul>
      </div>
    </div>
  )
}
