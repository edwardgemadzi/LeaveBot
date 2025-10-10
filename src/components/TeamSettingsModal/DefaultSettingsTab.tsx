import React from 'react'

interface DefaultSettingsTabProps {
  settings: {
    defaults?: {
      // No default working days - each user manages their own
    }
  }
  onSettingsChange: (settings: any) => void
}

export default function DefaultSettingsTab({ settings, onSettingsChange }: DefaultSettingsTabProps) {
  return (
    <div>
      <h3 className="mt-0 text-base font-semibold mb-4">
        Team Settings
      </h3>
      <p className="text-sm text-slate-600 mb-5">
        Team-level settings for leave management. Individual members can customize their own shift patterns and working days from their profile settings.
      </p>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold mb-2 text-blue-800">Working Days</h4>
        <p className="text-sm text-blue-700">
          Each team member manages their own working days and shift patterns through their profile settings. 
          The team calendar shows all days consistently for all members.
        </p>
      </div>
    </div>
  )
}
