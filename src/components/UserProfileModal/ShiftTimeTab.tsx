import React from 'react'
import { UserSettings } from '../../types'

interface ShiftTimeTabProps {
  settings: UserSettings
  onSettingsChange: (settings: UserSettings) => void
}

export default function ShiftTimeTab({ settings, onSettingsChange }: ShiftTimeTabProps) {
  return (
    <div>
      <h3 className="mt-0 text-base font-semibold mb-4">
        Select Your Shift Time
      </h3>
      <div className="flex flex-col gap-2.5">
        {[
          { value: 'day', label: '☀️ Day Shift', description: 'Typical daytime hours (08:00 - 17:00)' },
          { value: 'night', label: '🌙 Night Shift', description: 'Overnight hours (20:00 - 05:00)' },
          { value: 'custom', label: '🕐 Custom Hours', description: 'Define your specific shift hours' }
        ].map(option => (
          <label
            key={option.value}
            className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
              settings.shiftTime.type === option.value 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-slate-300 bg-white'
            }`}
          >
            <input
              type="radio"
              name="shiftTime"
              value={option.value}
              checked={settings.shiftTime.type === option.value}
              onChange={(e) => onSettingsChange({
                ...settings,
                shiftTime: { ...settings.shiftTime, type: e.target.value as 'day' | 'night' | 'custom' }
              })}
              className="mr-3 mt-0.5"
            />
            <div className="flex-1">
              <div className="font-medium text-sm">{option.label}</div>
              <div className="text-xs text-slate-600 mt-1">{option.description}</div>
            </div>
          </label>
        ))}
      </div>

      {settings.shiftTime.type === 'custom' && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Start Time
            </label>
            <input
              type="time"
              value={settings.shiftTime.customStart || '08:00'}
              onChange={(e) => onSettingsChange({
                ...settings,
                shiftTime: { ...settings.shiftTime, customStart: e.target.value }
              })}
              className="w-full p-2.5 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              End Time
            </label>
            <input
              type="time"
              value={settings.shiftTime.customEnd || '17:00'}
              onChange={(e) => onSettingsChange({
                ...settings,
                shiftTime: { ...settings.shiftTime, customEnd: e.target.value }
              })}
              className="w-full p-2.5 border border-slate-300 rounded-md text-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}
