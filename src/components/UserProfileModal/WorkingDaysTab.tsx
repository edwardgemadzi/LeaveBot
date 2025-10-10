import React from 'react'
import { UserSettings } from '../../types'

interface WorkingDaysTabProps {
  settings: UserSettings
  onSettingsChange: (settings: UserSettings) => void
}

export default function WorkingDaysTab({ settings, onSettingsChange }: WorkingDaysTabProps) {
  return (
    <div>
      <h3 className="mt-0 text-base font-semibold mb-4">
        Configure Your Shift Cycle
      </h3>
      <p className="text-sm text-slate-600 mb-5">
        Set the reference date for your shift rotation. This determines when your shift cycle starts (e.g., first day back after rotation).
      </p>
      
      <div>
        <label className="block font-semibold mb-2 text-gray-700">
          📅 Next First Day of Shift
        </label>
        <input
          type="date"
          value={settings.shiftPattern.referenceDate || ''}
          onChange={(e) => onSettingsChange({
            ...settings,
            shiftPattern: {
              ...settings.shiftPattern,
              referenceDate: e.target.value
            }
          })}
          className="w-full p-3 border border-slate-300 rounded-lg text-sm"
        />
        <p className="text-xs text-slate-600 mt-2">
          💡 This date is used as the starting point for calculating your shift rotation pattern (e.g., 2-2, 3-3, etc.)
        </p>
      </div>

      {/* Info Box */}
      <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="m-0 mb-2 text-blue-800 text-sm">
          ℹ️ How it works
        </h4>
        <ul className="m-0 pl-5 text-blue-800 text-xs leading-relaxed">
          <li>Set this to the first day you'll be working in your rotation</li>
          <li>For regular patterns: This isn't needed</li>
          <li>For rotation patterns (2-2, 3-3, etc.): The system will calculate all your working days from this date</li>
          <li>Example: If you work 2-2 and set this to Oct 8, you work Oct 8-9, off Oct 10-11, work Oct 12-13, and so on</li>
        </ul>
      </div>
    </div>
  )
}
