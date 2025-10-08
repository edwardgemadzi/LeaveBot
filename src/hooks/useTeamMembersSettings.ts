// Custom hook for fetching team members' settings
import { useState, useEffect } from 'react'
import type { Leave, UserSettings } from '../types'

export function useTeamMembersSettings(leaves: Leave[], token: string) {
  const [teamMembersSettings, setTeamMembersSettings] = useState<Record<string, UserSettings>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTeamMembersSettings = async () => {
      if (leaves.length === 0 || !token) return

      setLoading(true)
      setError(null)

      try {
        // Get unique user IDs from leaves
        const userIds = Array.from(new Set(leaves.map(leave => leave.userId)))
        
        // Fetch settings for each user
        const settingsMap: Record<string, UserSettings> = {}
        
        await Promise.all(userIds.map(async (userId) => {
          try {
            const res = await fetch(`/api/users?id=${userId}&action=settings`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            
            if (res.ok) {
              const data = await res.json()
              if (data.settings) {
                settingsMap[userId] = data.settings
              }
            }
          } catch (err) {
            console.error(`Failed to fetch settings for user ${userId}:`, err)
          }
        }))
        
        setTeamMembersSettings(settingsMap)
      } catch (err) {
        console.error('Error fetching team members settings:', err)
        setError('Failed to load team settings')
      } finally {
        setLoading(false)
      }
    }
    
    fetchTeamMembersSettings()
  }, [leaves, token])

  return { teamMembersSettings, loading, error }
}
