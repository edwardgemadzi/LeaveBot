import React, { useState, useEffect } from 'react'
import { api } from '../../utils/api'
import { UserSettings } from '../../types'
import UserProfileHeader from './UserProfileHeader'
import UserProfileTabs from './UserProfileTabs'
import ShiftPatternTab from './ShiftPatternTab'
import ShiftTimeTab from './ShiftTimeTab'
import WorkingDaysTab from './WorkingDaysTab'
import UserProfileMessages from './UserProfileMessages'
import UserProfileFooter from './UserProfileFooter'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    _id?: string
    id?: string
    name: string
    username: string
    settings?: UserSettings
  }
  token: string
  onSuccess: () => void
}

const defaultSettings: UserSettings = {
  shiftPattern: {
    type: 'regular',
    customPattern: '',
    referenceDate: new Date().toISOString().split('T')[0]
  },
  shiftTime: {
    type: 'day',
    customStart: '08:00',
    customEnd: '17:00'
  }
}

export default function UserProfileModal({ isOpen, onClose, user, token, onSuccess }: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'shift' | 'time' | 'days'>('shift')
  const [settings, setSettings] = useState<UserSettings>(user.settings || defaultSettings)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (isOpen) {
      setSettings(user.settings || defaultSettings)
      setError('')
      setSuccess('')
      setActiveTab('shift')
    }
  }, [isOpen, user])

  const handleSave = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const userId = user._id || user.id
      const data = await api.users.updateSettings(userId!, {
        shiftPattern: settings.shiftPattern,
        shiftTime: settings.shiftTime,
      }, token)

      if (data.success) {
        setSuccess('Profile settings saved successfully!')
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
      case 'shift':
        return (
          <ShiftPatternTab 
            settings={settings} 
            onSettingsChange={setSettings} 
          />
        )
      case 'time':
        return (
          <ShiftTimeTab 
            settings={settings} 
            onSettingsChange={setSettings} 
          />
        )
      case 'days':
        return (
          <WorkingDaysTab 
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
      <div className="bg-white rounded-xl w-[90%] max-w-[600px] max-h-[90vh] overflow-auto shadow-2xl">
        <UserProfileHeader 
          userName={user.name} 
          username={user.username} 
          onClose={onClose} 
        />
        
        <UserProfileTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        <div className="p-5">
          {renderActiveTab()}
          
          <UserProfileMessages 
            error={error} 
            success={success} 
          />
        </div>

        <UserProfileFooter 
          loading={loading} 
          onClose={onClose} 
          onSave={handleSave} 
        />
      </div>
    </div>
  )
}
