import React from 'react'

interface ConcurrentLimitsTabProps {
  settings: {
    concurrentLeave: {
      enabled: boolean
      maxPerTeam: number
      maxPerShift: number
      checkByShift: boolean
    }
  }
  onSettingsChange: (settings: any) => void
}

export default function ConcurrentLimitsTab({ settings, onSettingsChange }: ConcurrentLimitsTabProps) {
  return (
    <div>
      <h3 className="mt-0 text-base font-semibold mb-4">
        Concurrent Leave Limits
      </h3>
      <p className="text-sm text-slate-600 mb-5">
        Set maximum number of team members allowed on leave simultaneously.
      </p>

      <label className={`flex items-center p-3 border rounded-lg cursor-pointer mb-5 ${
        settings.concurrentLeave.enabled ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'
      }`}>
        <input
          type="checkbox"
          checked={settings.concurrentLeave.enabled}
          onChange={(e) => onSettingsChange({
            ...settings,
            concurrentLeave: { ...settings.concurrentLeave, enabled: e.target.checked }
          })}
          className="mr-3 w-4 h-4"
        />
        <span className="font-medium text-sm">Enable concurrent leave limits</span>
      </label>

      {settings.concurrentLeave.enabled && (
        <>
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">
              Maximum per Team
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={settings.concurrentLeave.maxPerTeam}
              onChange={(e) => onSettingsChange({
                ...settings,
                concurrentLeave: { ...settings.concurrentLeave, maxPerTeam: parseInt(e.target.value) || 1 }
              })}
              className="w-full p-2.5 border border-slate-300 rounded-md text-sm"
            />
            <p className="text-xs text-slate-600 mt-1">
              Total team members allowed on leave at the same time
            </p>
          </div>

          <label className="flex items-center p-3 border border-slate-300 rounded-lg cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={settings.concurrentLeave.checkByShift}
              onChange={(e) => onSettingsChange({
                ...settings,
                concurrentLeave: { ...settings.concurrentLeave, checkByShift: e.target.checked }
              })}
              className="mr-3 w-4 h-4"
            />
            <span className="text-sm">Apply limits per shift (day/night separately)</span>
          </label>

          {settings.concurrentLeave.checkByShift && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Maximum per Shift
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.concurrentLeave.maxPerShift}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  concurrentLeave: { ...settings.concurrentLeave, maxPerShift: parseInt(e.target.value) || 1 }
                })}
                className="w-full p-2.5 border border-slate-300 rounded-md text-sm"
              />
              <p className="text-xs text-slate-600 mt-1">
                Maximum allowed per shift (day or night) at the same time
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
