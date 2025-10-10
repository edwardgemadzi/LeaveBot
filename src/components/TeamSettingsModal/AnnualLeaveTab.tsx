import React from 'react'

interface AnnualLeaveTabProps {
  settings: {
    annualLeaveDays: number
  }
  onSettingsChange: (settings: any) => void
}

export default function AnnualLeaveTab({ settings, onSettingsChange }: AnnualLeaveTabProps) {
  return (
    <div>
      <h3 className="mt-0 text-base font-semibold mb-4">
        Annual Leave Allocation
      </h3>
      <p className="text-sm text-slate-600 mb-5">
        Set the number of working days allocated per year for team members.
      </p>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Working Days Per Year
        </label>
        <input
          type="number"
          min="1"
          max="365"
          value={settings.annualLeaveDays}
          onChange={(e) => onSettingsChange({
            ...settings,
            annualLeaveDays: parseInt(e.target.value) || 21
          })}
          className="w-full p-3 border border-slate-300 rounded-md text-base font-semibold"
        />
        <p className="text-xs text-slate-600 mt-1">
          This will update the leave balance for all team members
        </p>
      </div>

      <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-800 mb-2 font-medium">
          ℹ️ Common Allocations:
        </div>
        <div className="text-xs text-blue-600">
          • UK Standard: 28 days (including bank holidays)<br />
          • US Average: 10-15 days<br />
          • EU Minimum: 20 days<br />
          • Custom: Set any value between 1-365 days
        </div>
      </div>
    </div>
  )
}
