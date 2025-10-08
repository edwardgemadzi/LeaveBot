/**
 * Custom hook for team CRUD operations
 */

import { useState } from 'react'
import { api, ApiError } from '../utils/api'

export function useTeamOperations(token: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const createTeam = async (teamData: {
    name: string
    description: string
    leaderId?: string
  }) => {
    setLoading(true)
    setError('')

    try {
      const result = await api.teams.create(teamData, token)
      if (result.success) {
        return { success: true, team: result.team }
      }
      setError(result.error || 'Failed to create team')
      return { success: false, error: result.error }
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Network error'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const updateTeam = async (
    teamId: string,
    teamData: {
      name?: string
      description?: string
      leaderId?: string
    }
  ) => {
    setLoading(true)
    setError('')

    try {
      const result = await api.teams.update(teamId, teamData, token)
      if (result.success) {
        return { success: true, team: result.team }
      }
      setError(result.error || 'Failed to update team')
      return { success: false, error: result.error }
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Network error'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const deleteTeam = async (teamId: string) => {
    setLoading(true)
    setError('')

    try {
      const result = await api.teams.delete(teamId, token)
      if (result.success) {
        return { success: true }
      }
      setError(result.error || 'Failed to delete team')
      return { success: false, error: result.error }
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Network error'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const assignUserToTeam = async (teamId: string, userId: string) => {
    setLoading(true)
    setError('')

    try {
      const result = await api.teams.addMember(teamId, userId, token)
      if (result.success) {
        return { success: true }
      }
      setError(result.error || 'Failed to assign user')
      return { success: false, error: result.error }
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Network error'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const removeUserFromTeam = async (teamId: string, userId: string) => {
    setLoading(true)
    setError('')

    try {
      const result = await api.teams.removeMember(teamId, userId, token)
      if (result.success) {
        return { success: true }
      }
      setError(result.error || 'Failed to remove user')
      return { success: false, error: result.error }
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Network error'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  return {
    createTeam,
    updateTeam,
    deleteTeam,
    assignUserToTeam,
    removeUserFromTeam,
    loading,
    error,
  }
}
