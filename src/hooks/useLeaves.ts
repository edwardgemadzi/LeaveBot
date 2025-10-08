/**
 * Custom hook for fetching leaves
 */

import { useState, useEffect } from 'react'
import { api, ApiError } from '../utils/api'
import { Leave } from '../types'

export function useLeaves(token: string, autoLoad = true) {
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const loadLeaves = async () => {
    if (!token) return

    setLoading(true)
    setError('')

    try {
      const data = await api.leaves.getAll(token)
      if (data.success) {
        setLeaves(data.leaves)
      } else {
        setError(data.error || 'Failed to load leaves')
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
      loadLeaves()
    }
  }, [token, autoLoad])

  const createLeave = async (leaveData: any) => {
    try {
      const data = await api.leaves.create(leaveData, token)
      if (data.success) {
        await loadLeaves() // Refresh list
        return { success: true, data: data.leave }
      }
      return { success: false, error: data.error }
    } catch (err) {
      if (err instanceof ApiError) {
        return { success: false, error: err.message }
      }
      return { success: false, error: 'Network error' }
    }
  }

  const updateLeaveStatus = async (leaveId: string, status: string) => {
    try {
      const data = await api.leaves.updateStatus(leaveId, status, token)
      if (data.success) {
        await loadLeaves() // Refresh list
        return { success: true }
      }
      return { success: false, error: data.error }
    } catch (err) {
      if (err instanceof ApiError) {
        return { success: false, error: err.message }
      }
      return { success: false, error: 'Network error' }
    }
  }

  const deleteLeave = async (leaveId: string) => {
    try {
      const data = await api.leaves.delete(leaveId, token)
      if (data.success) {
        await loadLeaves() // Refresh list
        return { success: true }
      }
      return { success: false, error: data.error }
    } catch (err) {
      if (err instanceof ApiError) {
        return { success: false, error: err.message }
      }
      return { success: false, error: 'Network error' }
    }
  }

  return {
    leaves,
    loading,
    error,
    refetch: loadLeaves,
    createLeave,
    updateLeaveStatus,
    deleteLeave,
  }
}
