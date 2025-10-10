import React from 'react'
import { TeamSettings } from '../../types'

interface LimitsFormProps {
  settings: TeamSettings
  setSettings: (settings: TeamSettings) => void
  loading: boolean
}

export default function LimitsForm({ settings, setSettings, loading }: LimitsFormProps) {
  return (
    <div>
      <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>
        Concurrent Leave Limits
      </h3>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
        Set maximum number of team members allowed on leave simultaneously.
      </p>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 15px',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        cursor: 'pointer',
        marginBottom: '20px',
        background: settings.concurrentLeave.enabled ? '#eff6ff' : '#f9fafb'
      }}>
        <input
          type="checkbox"
          checked={settings.concurrentLeave.enabled}
          disabled={loading}
          onChange={e => setSettings({
            ...settings,
            concurrentLeave: {
              ...settings.concurrentLeave,
              enabled: e.target.checked
            }
          })}
          className="mr-2.5"
        />
        Enable concurrent leave limits
      </label>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label className="text-sm text-gray-700 mb-1.5 block">
            Max per Team
          </label>
          <input
            type="number"
            min={1}
            value={settings.concurrentLeave.maxPerTeam}
            disabled={loading || !settings.concurrentLeave.enabled}
            onChange={e => setSettings({
              ...settings,
              concurrentLeave: {
                ...settings.concurrentLeave,
                maxPerTeam: Number(e.target.value)
              }
            })}
            className="w-20 p-1.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-sm text-gray-700 mb-1.5 block">
            Max per Shift
          </label>
          <input
            type="number"
            min={1}
            value={settings.concurrentLeave.maxPerShift}
            disabled={loading || !settings.concurrentLeave.enabled}
            onChange={e => setSettings({
              ...settings,
              concurrentLeave: {
                ...settings.concurrentLeave,
                maxPerShift: Number(e.target.value)
              }
            })}
            className="w-20 p-1.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#374151', marginBottom: '10px' }}>
        <input
          type="checkbox"
          checked={settings.concurrentLeave.checkByShift}
          disabled={loading || !settings.concurrentLeave.enabled}
          onChange={e => setSettings({
            ...settings,
            concurrentLeave: {
              ...settings.concurrentLeave,
              checkByShift: e.target.checked
            }
          })}
          className="mr-2.5"
        />
        Check limits by shift pattern
      </label>
    </div>
  )
}
