import React from 'react'

interface DefaultSettingsTabProps {
  settings: {
    defaults?: {
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
        Default Working Days for New Members
      </h3>
      <p className="text-sm text-slate-600 mb-5">
        These working days will be automatically applied to new team members. Individual members can customize their own shift patterns and times from their profile settings.
      </p>

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
