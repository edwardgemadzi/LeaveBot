import React, { useState, useEffect } from 'react'
import { api } from '../../utils/api'
import TeamSettingsHeader from './TeamSettingsHeader'
import TeamSettingsTabs from './TeamSettingsTabs'
import ConcurrentLimitsTab from './ConcurrentLimitsTab'
import AnnualLeaveTab from './AnnualLeaveTab'
import DefaultSettingsTab from './DefaultSettingsTab'
import TeamSettingsMessages from './TeamSettingsMessages'
import TeamSettingsFooter from './TeamSettingsFooter'

interface TeamSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  team: {
    _id: string
    name: string
    settings?: {
      concurrentLeave: {
        enabled: boolean
        maxPerTeam: number
        maxPerShift: number
        checkByShift: boolean
      }
      annualLeaveDays: number
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
  }
  token: string
  onSuccess: () => void
}

const defaultSettings = {
  concurrentLeave: {
    enabled: false,
    maxPerTeam: 3,
    maxPerShift: 2,
    checkByShift: false
  },
  annualLeaveDays: 21,
  defaults: {
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

export default function TeamSettingsModal({ isOpen, onClose, team, token, onSuccess }: TeamSettingsModalProps) {
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
      const data = await api.teams.updateSettings(team._id, {
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

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'limits':
        return (
          <ConcurrentLimitsTab 
            settings={settings} 
            onSettingsChange={setSettings} 
          />
        )
      case 'annual':
        return (
          <AnnualLeaveTab 
            settings={settings} 
            onSettingsChange={setSettings} 
          />
        )
      case 'defaults':
        return (
          <DefaultSettingsTab 
            settings={settings} 
            onSettingsChange={setSettings} 
          />
        )
      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-xl w-[90%] max-w-[700px] max-h-[90vh] overflow-auto shadow-2xl">
        <TeamSettingsHeader 
          teamName={team.name} 
          onClose={onClose} 
        />
        
        <TeamSettingsTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        <div className="p-5">
          {renderActiveTab()}
          
          <TeamSettingsMessages 
            error={error} 
            success={success} 
          />
        </div>

        <TeamSettingsFooter 
          loading={loading} 
          onClose={onClose} 
          onSave={handleSave} 
        />
      </div>
    </div>
  )
}
