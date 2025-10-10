import React from 'react'
import { TeamSettings } from '../../types'

interface AnnualFormProps {
  settings: TeamSettings
  setSettings: (settings: TeamSettings) => void
  loading: boolean
}

export default function AnnualForm({ settings, setSettings, loading }: AnnualFormProps) {
  return (
    <div>
      <h3 className="mt-0 text-base font-semibold mb-4">
        Annual Leave Days
      </h3>
      <p className="text-sm text-gray-500 mb-5">
        Set the default number of annual leave days for this team.
      </p>
      <label className="text-sm text-gray-700 mb-1.5 block">
        Annual Leave Days
      </label>
      <input
        type="number"
        min={1}
        value={settings.annualLeaveDays}
        disabled={loading}
        onChange={e => setSettings({
          ...settings,
          annualLeaveDays: Number(e.target.value)
        })}
        className="w-25 p-1.5 rounded-md border border-gray-300 mb-5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  )
}
