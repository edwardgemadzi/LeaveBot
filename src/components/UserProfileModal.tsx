import { useState, useEffect } from 'react'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    _id?: string
    id?: string
    name: string
    username: string
    settings?: {
      shiftPattern: {
        type: string
        customPattern?: string
        referenceDate?: string
      }
      shiftTime: {
        type: string
        customStart?: string
        customEnd?: string
      }
      workingDays: {
        monday: boolean
        tuesday: boolean
        wednesday: boolean
        thursday: boolean
        friday: boolean
        saturday: boolean
        sunday: boolean
      }
    }
  }
  token: string
  onSuccess: () => void
}

const defaultSettings = {
  shiftPattern: {
    type: 'regular',
    customPattern: '',
    referenceDate: new Date().toISOString().split('T')[0]
  },
  shiftTime: {
    type: 'day',
    customStart: '08:00',
    customEnd: '17:00'
  },
  workingDays: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false
  }
}

export default function UserProfileModal({ isOpen, onClose, user, token, onSuccess }: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'shift' | 'time' | 'days'>('shift')
  const [settings, setSettings] = useState(user.settings || defaultSettings)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (isOpen) {
      setSettings(user.settings || defaultSettings)
      setError('')
      setSuccess('')
      setActiveTab('shift')
    }
  }, [isOpen, user])

  const handleSave = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const userId = user._id || user.id
      const res = await fetch(`/api/users?id=${userId}&action=settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shiftPattern: settings.shiftPattern,
          shiftTime: settings.shiftTime,
          workingDays: settings.workingDays
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess('Profile settings saved successfully!')
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1500)
      } else {
        setError(data.error || 'Failed to save settings')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
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
        borderRadius: '10px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 10
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>👤 My Profile Settings</h2>
            <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#6b7280' }}>{user.name} (@{user.username})</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0 10px'
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          overflowX: 'auto',
          position: 'sticky',
          top: '81px',
          background: 'white',
          zIndex: 9
        }}>
          {[
            { id: 'shift', label: '🔄 My Shift Pattern' },
            { id: 'time', label: '⏰ My Shift Time' },
            { id: 'days', label: '📅 My Working Days' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 16px',
                background: activeTab === tab.id ? '#eff6ff' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* Shift Pattern Tab */}
          {activeTab === 'shift' && (
            <div>
              <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>
                Select Your Shift Pattern
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { value: 'regular', label: 'Regular (Mon-Fri)', description: 'Standard Monday to Friday workweek' },
                  { value: '2-2', label: '2/2 Shift', description: '2 days on, 2 days off rotating pattern' },
                  { value: '5-2', label: '5/2 Shift', description: '5 days on, 2 days off rotating pattern' },
                  { value: 'custom', label: 'Custom Pattern', description: 'Define your own shift cycle' }
                ].map(option => (
                  <label
                    key={option.value}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '15px',
                      border: settings.shiftPattern.type === option.value ? '2px solid #3b82f6' : '1px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: settings.shiftPattern.type === option.value ? '#eff6ff' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="radio"
                      name="shiftPattern"
                      value={option.value}
                      checked={settings.shiftPattern.type === option.value}
                      onChange={(e) => setSettings({
                        ...settings,
                        shiftPattern: { ...settings.shiftPattern, type: e.target.value }
                      })}
                      style={{ marginRight: '12px', marginTop: '3px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', fontSize: '15px' }}>{option.label}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '3px' }}>{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>

              {settings.shiftPattern.type === 'custom' && (
                <div style={{ marginTop: '15px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    Custom Pattern (e.g., "3-2" for 3 on, 2 off)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 3-2"
                    value={settings.shiftPattern.customPattern || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      shiftPattern: { ...settings.shiftPattern, customPattern: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  />
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginTop: '15px', marginBottom: '8px' }}>
                    Reference Date (first day of your cycle)
                  </label>
                  <input
                    type="date"
                    value={settings.shiftPattern.referenceDate || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      shiftPattern: { ...settings.shiftPattern, referenceDate: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Shift Time Tab */}
          {activeTab === 'time' && (
            <div>
              <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>
                Select Your Shift Time
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { value: 'day', label: '☀️ Day Shift', description: 'Typical daytime hours (08:00 - 17:00)' },
                  { value: 'night', label: '🌙 Night Shift', description: 'Overnight hours (20:00 - 05:00)' },
                  { value: 'custom', label: '🕐 Custom Hours', description: 'Define your specific shift hours' }
                ].map(option => (
                  <label
                    key={option.value}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '15px',
                      border: settings.shiftTime.type === option.value ? '2px solid #3b82f6' : '1px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: settings.shiftTime.type === option.value ? '#eff6ff' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="radio"
                      name="shiftTime"
                      value={option.value}
                      checked={settings.shiftTime.type === option.value}
                      onChange={(e) => setSettings({
                        ...settings,
                        shiftTime: { ...settings.shiftTime, type: e.target.value }
                      })}
                      style={{ marginRight: '12px', marginTop: '3px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', fontSize: '15px' }}>{option.label}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '3px' }}>{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>

              {settings.shiftTime.type === 'custom' && (
                <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={settings.shiftTime.customStart || '08:00'}
                      onChange={(e) => setSettings({
                        ...settings,
                        shiftTime: { ...settings.shiftTime, customStart: e.target.value }
                      })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '5px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      End Time
                    </label>
                    <input
                      type="time"
                      value={settings.shiftTime.customEnd || '17:00'}
                      onChange={(e) => setSettings({
                        ...settings,
                        shiftTime: { ...settings.shiftTime, customEnd: e.target.value }
                      })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '5px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Working Days Tab */}
          {activeTab === 'days' && (
            <div>
              <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>
                Configure Your Working Days
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
                Select which days you typically work. This affects how your leave days are calculated.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { key: 'monday', label: 'Monday' },
                  { key: 'tuesday', label: 'Tuesday' },
                  { key: 'wednesday', label: 'Wednesday' },
                  { key: 'thursday', label: 'Thursday' },
                  { key: 'friday', label: 'Friday' },
                  { key: 'saturday', label: 'Saturday' },
                  { key: 'sunday', label: 'Sunday' }
                ].map(day => (
                  <label
                    key={day.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 15px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: settings.workingDays[day.key as keyof typeof settings.workingDays] ? '#f0fdf4' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={settings.workingDays[day.key as keyof typeof settings.workingDays]}
                      onChange={(e) => setSettings({
                        ...settings,
                        workingDays: { ...settings.workingDays, [day.key]: e.target.checked }
                      })}
                      style={{ marginRight: '12px', width: '18px', height: '18px' }}
                    />
                    <span style={{ fontWeight: '500', fontSize: '15px' }}>{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div style={{
              marginTop: '20px',
              padding: '12px 15px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '14px'
            }}>
              ❌ {error}
            </div>
          )}

          {success && (
            <div style={{
              marginTop: '20px',
              padding: '12px 15px',
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '8px',
              color: '#16a34a',
              fontSize: '14px'
            }}>
              ✅ {success}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end',
          position: 'sticky',
          bottom: 0,
          background: 'white'
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: loading ? '#9ca3af' : '#3b82f6',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: 'white'
            }}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
