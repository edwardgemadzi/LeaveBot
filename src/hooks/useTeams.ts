/**
 * Custom hook for fetching teams
 */

import { useState, useEffect } from 'react'
import { api, ApiError } from '../utils/api'
import { normalizeTeam } from '../utils/normalize'
import { Team } from '../types'

export function useTeams(token: string, autoLoad = true) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const loadTeams = async () => {
    if (!token) return

    setLoading(true)
    setError('')

    try {
      const data = await api.teams.getAll(token)
      if (data.success) {
        setTeams((data.teams || []).map(normalizeTeam))
      } else {
        setError(data.error || 'Failed to load teams')
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Network error. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoLoad && token) {
      loadTeams()
    }
  }, [token, autoLoad])

  return { teams, loading, error, refetch: loadTeams }
}
