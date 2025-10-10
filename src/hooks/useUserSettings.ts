import { useEffect, useState } from 'react'
import { api } from '../utils/api'
import type { UserSettings } from '../types'

export function useUserSettings(userId?: string, token?: string) {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId || !token) return

    let isCancelled = false
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await api.users.getSettings(userId, token)
        if (!isCancelled && data?.settings) {
          setSettings(data.settings as UserSettings)
        }
      } catch (err: any) {
        if (!isCancelled) setError(err.message || 'Failed to load user settings')
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    load()

    return () => {
      isCancelled = true
      controller.abort()
    }
  }, [userId, token])

  return { settings, loading, error }
}


