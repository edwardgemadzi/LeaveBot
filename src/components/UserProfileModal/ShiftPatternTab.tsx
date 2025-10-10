import React from 'react'
import { UserSettings } from '../../types'

interface ShiftPatternTabProps {
  settings: UserSettings
  onSettingsChange: (settings: UserSettings) => void
}

export default function ShiftPatternTab({ settings, onSettingsChange }: ShiftPatternTabProps) {
  return (
    <div>
      <h3 className="mt-0 text-base font-semibold mb-4">
        Select Your Shift Pattern
      </h3>
      <div className="flex flex-col gap-2.5">
        {[
          { value: 'regular', label: 'Regular (Mon-Fri)', description: 'Standard Monday to Friday workweek' },
          { value: '2-2', label: '2/2 Shift', description: '2 days on, 2 days off rotating pattern' },
          { value: '5-2', label: '5/2 Shift', description: '5 days on, 2 days off rotating pattern' },
          { value: 'custom', label: 'Custom Pattern', description: 'Define your own shift cycle' }
        ].map(option => (
          <label
            key={option.value}
            className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
              settings.shiftPattern.type === option.value 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-slate-300 bg-white'
            }`}
          >
            <input
              type="radio"
              name="shiftPattern"
              value={option.value}
              checked={settings.shiftPattern.type === option.value}
              onChange={(e) => onSettingsChange({
                ...settings,
                shiftPattern: { ...settings.shiftPattern, type: e.target.value as 'regular' | '2-2' | '3-3' | '4-4' | '5-5' | 'custom' }
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

      {settings.shiftPattern.type === 'custom' && (
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">
            Custom Pattern (e.g., "3-2" for 3 on, 2 off)
          </label>
          <input
            type="text"
            placeholder="e.g., 3-2"
            value={settings.shiftPattern.customPattern || ''}
            onChange={(e) => onSettingsChange({
              ...settings,
              shiftPattern: { ...settings.shiftPattern, customPattern: e.target.value }
            })}
            className="w-full p-2.5 border border-slate-300 rounded-md text-sm"
          />
          <label className="block text-sm font-medium mt-4 mb-2">
            Reference Date (first day of your cycle)
          </label>
          <input
            type="date"
            value={settings.shiftPattern.referenceDate || ''}
            onChange={(e) => onSettingsChange({
              ...settings,
              shiftPattern: { ...settings.shiftPattern, referenceDate: e.target.value }
            })}
            className="w-full p-2.5 border border-slate-300 rounded-md text-sm"
          />
        </div>
      )}
    </div>
  )
}
