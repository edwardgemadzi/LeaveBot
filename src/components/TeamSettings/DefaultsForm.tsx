import React from 'react'
import { TeamSettings } from '../../types'

interface DefaultsFormProps {
  settings: TeamSettings
  setSettings: (settings: TeamSettings) => void
  loading: boolean
}

export default function DefaultsForm({ settings, setSettings, loading }: DefaultsFormProps) {
  const { shiftPattern, shiftTime, workingDays } = settings.defaults
  return (
    <div>
      <h3 className="mt-0 text-base font-semibold mb-4">
        Default Team Settings
      </h3>
      <p className="text-sm text-gray-500 mb-5">
        Configure default shift pattern, shift time, and working days for new team members.
      </p>
      {/* Shift Pattern */}
      <label className="text-sm text-gray-700 mb-1.5 block">
        Shift Pattern
      </label>
      <select
        value={shiftPattern.type}
        disabled={loading}
        onChange={e => setSettings({
          ...settings,
          defaults: {
            ...settings.defaults,
            shiftPattern: {
              ...settings.defaults.shiftPattern,
              type: e.target.value
            }
          }
        })}
        className="w-40 p-1.5 rounded-md border border-gray-300 mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="regular">Regular (Mon-Fri)</option>
        <option value="2-2">2-on-2-off</option>
        <option value="3-3">3-on-3-off</option>
        <option value="4-4">4-on-4-off</option>
        <option value="5-5">5-on-5-off</option>
        <option value="custom">Custom</option>
      </select>
      {/* Custom Pattern Input */}
      {shiftPattern.type === 'custom' && (
        <input
          type="text"
          placeholder="Custom pattern (e.g. 2-2-3)"
          value={shiftPattern.customPattern || ''}
          disabled={loading}
          onChange={e => setSettings({
            ...settings,
            defaults: {
              ...settings.defaults,
              shiftPattern: {
                ...settings.defaults.shiftPattern,
                customPattern: e.target.value
              }
            }
          })}
          className="w-45 p-1.5 rounded-md border border-gray-300 mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      )}
      {/* Reference Date */}
      <label className="text-sm text-gray-700 mb-1.5 block">
        Reference Date
      </label>
      <input
        type="date"
        value={shiftPattern.referenceDate || ''}
        disabled={loading}
        onChange={e => setSettings({
          ...settings,
          defaults: {
            ...settings.defaults,
            shiftPattern: {
              ...settings.defaults.shiftPattern,
              referenceDate: e.target.value
            }
          }
        })}
        className="w-40 p-1.5 rounded-md border border-gray-300 mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      {/* Shift Time */}
      <label className="text-sm text-gray-700 mb-1.5 block">
        Shift Time
      </label>
      <select
        value={shiftTime.type}
        disabled={loading}
        onChange={e => setSettings({
          ...settings,
          defaults: {
            ...settings.defaults,
            shiftTime: {
              ...settings.defaults.shiftTime,
              type: e.target.value
            }
          }
        })}
        className="w-40 p-1.5 rounded-md border border-gray-300 mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="day">Day</option>
        <option value="night">Night</option>
        <option value="custom">Custom</option>
      </select>
      {/* Custom Time Inputs */}
      {shiftTime.type === 'custom' && (
        <div className="flex gap-2.5 mb-3">
          <input
            type="time"
            value={shiftTime.customStart || ''}
            disabled={loading}
            onChange={e => setSettings({
              ...settings,
              defaults: {
                ...settings.defaults,
                shiftTime: {
                  ...settings.defaults.shiftTime,
                  customStart: e.target.value
                }
              }
            })}
            className="w-25 p-1.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="time"
            value={shiftTime.customEnd || ''}
            disabled={loading}
            onChange={e => setSettings({
              ...settings,
              defaults: {
                ...settings.defaults,
                shiftTime: {
                  ...settings.defaults.shiftTime,
                  customEnd: e.target.value
                }
              }
            })}
            className="w-25 p-1.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}
      {/* Working Days */}
      <label className="text-sm text-gray-700 mb-1.5 block">
        Working Days
      </label>
      <div className="flex gap-2.5 mb-3">
        {Object.entries(workingDays).map(([day, value]) => (
          <label key={day} className="text-xs text-gray-700 flex items-center gap-1">
            <input
              type="checkbox"
              checked={value}
              disabled={loading}
              onChange={e => setSettings({
                ...settings,
                defaults: {
                  ...settings.defaults,
                  workingDays: {
                    ...settings.defaults.workingDays,
                    [day]: e.target.checked
                  }
                }
              })}
            />
            {day.charAt(0).toUpperCase() + day.slice(1)}
          </label>
        ))}
      </div>
    </div>
  )
}
