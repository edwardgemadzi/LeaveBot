import React, { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { User } from '../types'

interface TeamLeaveSettingsProps {
  user: User
  token: string
}

export default function TeamLeaveSettings({ user, token }: TeamLeaveSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [teamId, setTeamId] = useState<string | null>(null)
  const [teamSettings, setTeamSettings] = useState({
    annualLeaveDays: 21,
    maxConsecutiveDays: 14,
    minAdvanceNoticeDays: 7,
    allowNegativeBalance: false,
    carryOverDays: 5,
    maxConcurrentLeave: 3 // Max people on leave at the same time
  })

  useEffect(() => {
    loadTeamAndSettings()
  }, [])

  const loadTeamAndSettings = async () => {
    setLoading(true)
    try {
      // First, get the leader's team
      const teamsRes = await api.teams.getAll(token)
      
      if (!teamsRes?.success) {
        setError(teamsRes?.error || 'Failed to load your team information')
        return
      }
      const leaderTeam = Array.isArray(teamsRes.teams) ? teamsRes.teams[0] : teamsRes.teams?.[0]
      
      if (!leaderTeam) {
        setError('You are not assigned to any team')
        return
      }
      
      setTeamId(leaderTeam._id)
      
      // Now load the team settings
      const settingsData = await api.teams.getSettings(leaderTeam._id, token)
      if (settingsData.settings) setTeamSettings(settingsData.settings)
    } catch (err) {
      console.error('Failed to load team settings:', err)
      setError('Failed to load team settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!teamId) {
      setError('Team ID not found')
      return
    }
    
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      const data = await api.teams.updateSettings(teamId, teamSettings, token)
      if (data.success || data.message) {
        setSuccess('Team leave settings saved successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to save settings')
      }
    } catch (err: any) {
      console.error('Save error:', err)
      setError(`Network error: ${err.message || 'Please try again.'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-5 text-center">
        <div className="text-5xl mb-5">⏳</div>
        <p>Loading team settings...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl p-8 shadow-lg">
        <h2 className="mt-0 text-gray-800 mb-2.5 text-2xl font-semibold">
          ⚙️ Team Leave Settings
        </h2>
        <p className="text-gray-500 mb-8">
          Configure leave policies for your entire team
        </p>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg mb-5 border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 text-green-700 rounded-lg mb-5 border border-green-200">
            {success}
          </div>
        )}

        <div className="flex flex-col gap-6">
          {/* Annual Leave Days */}
          <div>
            <label className="block font-semibold mb-2 text-gray-700">
              📅 Annual Leave Days per Year
            </label>
            <input
              type="number"
              min="0"
              max="365"
              value={teamSettings.annualLeaveDays}
              onChange={(e) => setTeamSettings({
                ...teamSettings,
                annualLeaveDays: parseInt(e.target.value) || 0
              })}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Total annual leave days each team member is entitled to
            </p>
          </div>

          {/* Max Consecutive Days */}
          <div>
            <label className="block font-semibold mb-2 text-gray-700">
              🔢 Maximum Consecutive Days
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={teamSettings.maxConsecutiveDays}
              onChange={(e) => setTeamSettings({
                ...teamSettings,
                maxConsecutiveDays: parseInt(e.target.value) || 1
              })}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum number of consecutive days a team member can request
            </p>
          </div>

          {/* Minimum Advance Notice */}
          <div>
            <label className="block font-semibold mb-2 text-gray-700">
              ⏰ Minimum Advance Notice (days)
            </label>
            <input
              type="number"
              min="0"
              max="90"
              value={teamSettings.minAdvanceNoticeDays}
              onChange={(e) => setTeamSettings({
                ...teamSettings,
                minAdvanceNoticeDays: parseInt(e.target.value) || 0
              })}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum days in advance a leave request must be submitted
            </p>
          </div>

          {/* Carry Over Days */}
          <div>
            <label className="block font-semibold mb-2 text-gray-700">
              📦 Carry Over Days
            </label>
            <input
              type="number"
              min="0"
              max="30"
              value={teamSettings.carryOverDays}
              onChange={(e) => setTeamSettings({
                ...teamSettings,
                carryOverDays: parseInt(e.target.value) || 0
              })}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum unused days that can be carried over to next year
            </p>
          </div>

          {/* Max Concurrent Leave */}
          <div>
            <label className="block font-semibold mb-2 text-gray-700">
              👥 Maximum Concurrent Leave
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={teamSettings.maxConcurrentLeave}
              onChange={(e) => setTeamSettings({
                ...teamSettings,
                maxConcurrentLeave: parseInt(e.target.value) || 1
              })}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum number of team members who can be on leave at the same time
            </p>
          </div>

          {/* Allow Negative Balance */}
          <div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={teamSettings.allowNegativeBalance}
                onChange={(e) => setTeamSettings({
                  ...teamSettings,
                  allowNegativeBalance: e.target.checked
                })}
                className="cursor-pointer w-4.5 h-4.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-semibold text-gray-700">
                💳 Allow Negative Leave Balance
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-7">
              Allow team members to go into negative leave balance (borrow from next year)
            </p>
          </div>

          {/* Save Button */}
          <div className="flex gap-2.5 mt-2.5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 text-white border-none rounded-lg text-base font-semibold cursor-pointer disabled:cursor-not-allowed transition-colors duration-200"
            >
              {saving ? '💾 Saving...' : '💾 Save Settings'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mt-5">
        <h3 className="mt-0 text-blue-800 text-base font-semibold">
          ℹ️ About Team Leave Settings
        </h3>
        <ul className="text-blue-800 text-sm leading-relaxed my-2.5">
          <li>These settings apply to all team members</li>
          <li>Changes take effect immediately</li>
          <li>Individual shift patterns are set per team member</li>
          <li>Leave balance is calculated automatically based on approved leaves</li>
        </ul>
      </div>
    </div>
  )
}
