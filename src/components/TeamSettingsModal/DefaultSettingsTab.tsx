import React from 'react'

interface DefaultSettingsTabProps {
  settings: {
    defaults?: {
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
  onSettingsChange: (settings: any) => void
}

export default function DefaultSettingsTab({ settings, onSettingsChange }: DefaultSettingsTabProps) {
  return (
    <div>
      <h3 className="mt-0 text-base font-semibold mb-4">
        Default Settings for New Members
      </h3>
      <p className="text-sm text-slate-600 mb-5">
        These settings will be automatically applied to new team members. Individual members can customize their own shift settings from their profile.
      </p>

      {/* Default Shift Pattern */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold mb-3">Default Shift Pattern</h4>
        <div className="flex flex-col gap-2.5">
          {[
            { value: 'regular', label: 'Regular (Mon-Fri)', description: 'Standard Monday to Friday workweek' },
            { value: '2-2', label: '2/2 Shift', description: '2 days on, 2 days off rotating pattern' },
            { value: '5-2', label: '5/2 Shift', description: '5 days on, 2 days off rotating pattern' }
          ].map(option => (
            <label
              key={option.value}
              className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all text-sm ${
                settings.defaults?.shiftPattern?.type === option.value 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-slate-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="defaultShiftPattern"
                value={option.value}
                checked={settings.defaults?.shiftPattern?.type === option.value}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  defaults: {
                    ...settings.defaults!,
                    shiftPattern: { ...settings.defaults!.shiftPattern, type: e.target.value }
                  }
                })}
                className="mr-2.5 mt-0.5"
              />
              <div className="flex-1">
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-slate-600 mt-0.5">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Default Shift Time */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold mb-3">Default Shift Time</h4>
        <div className="flex gap-2.5">
          {[
            { value: 'day', label: '☀️ Day Shift' },
            { value: 'night', label: '🌙 Night Shift' }
          ].map(option => (
            <label
              key={option.value}
              className={`flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all text-sm font-medium ${
                settings.defaults?.shiftTime?.type === option.value 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-slate-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="defaultShiftTime"
                value={option.value}
                checked={settings.defaults?.shiftTime?.type === option.value}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  defaults: {
                    ...settings.defaults!,
                    shiftTime: { ...settings.defaults!.shiftTime, type: e.target.value }
                  }
                })}
                className="mr-2"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {/* Default Working Days */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Default Working Days</h4>
        <div className="grid grid-cols-7 gap-2">
          {[
            { key: 'monday', label: 'Mon' },
            { key: 'tuesday', label: 'Tue' },
            { key: 'wednesday', label: 'Wed' },
            { key: 'thursday', label: 'Thu' },
            { key: 'friday', label: 'Fri' },
            { key: 'saturday', label: 'Sat' },
            { key: 'sunday', label: 'Sun' }
          ].map(day => (
            <label
              key={day.key}
              className={`flex items-center justify-center p-2.5 border rounded-md cursor-pointer transition-all text-xs font-medium ${
                settings.defaults?.workingDays?.[day.key as keyof typeof settings.defaults.workingDays] 
                  ? 'bg-green-50 border-green-300' 
                  : 'bg-white border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={settings.defaults?.workingDays?.[day.key as keyof typeof settings.defaults.workingDays] || false}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  defaults: {
                    ...settings.defaults!,
                    workingDays: { ...settings.defaults!.workingDays, [day.key]: e.target.checked }
                  }
                })}
                className="mr-1.5 w-4 h-4"
              />
              {day.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
