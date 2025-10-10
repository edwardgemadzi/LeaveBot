import { useState, useEffect } from 'react'
import type { Team } from '../types'
import { api } from '../utils/api'
import { getTeamId } from '../utils/teamIdHelpers'

interface UseTeamSettingsModalParams {
  team: Team
  isOpen: boolean
  token: string
  onSuccess: () => void
  onClose: () => void
}

export function useTeamSettingsModal({ team, isOpen, token, onSuccess, onClose }: UseTeamSettingsModalParams) {
  const defaultSettings = {
    concurrentLeave: {
      enabled: false,
      maxPerTeam: 3,
      maxPerShift: 2,
      checkByShift: false
    },
    annualLeaveDays: 21,
    defaults: {
      shiftPattern: {
        type: 'regular',
        customPattern: '',
        referenceDate: new Date().toISOString().split('T')[0]
      },
      shiftTime: {
        type: 'day',
        customStart: '08:00',
        customEnd: '17:00'
      },
      workingDays: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false
      }
    }
  }

  const [activeTab, setActiveTab] = useState<'limits' | 'annual' | 'defaults'>('limits')
  const [settings, setSettings] = useState(team.settings || defaultSettings)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (isOpen) {
      setSettings(team.settings || defaultSettings)
      setError('')
      setSuccess('')
      setActiveTab('limits')
    }
  }, [isOpen, team])

  const handleSave = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const data = await api.teams.updateSettings(getTeamId(team), {
        concurrentLeave: settings.concurrentLeave,
        annualLeaveDays: settings.annualLeaveDays,
        defaults: settings.defaults
      }, token)
      
      if (data.success) {
        setSuccess('Settings saved successfully!')
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1500)
      } else {
        setError(data.error || 'Failed to save settings')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return {
    activeTab,
    setActiveTab,
    settings,
    setSettings,
    loading,
    error,
    success,
    handleSave
  }
}
