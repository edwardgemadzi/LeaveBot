/**
 * Custom hook for user CRUD operations
 */

import { useState } from 'react'
import { api, ApiError } from '../utils/api'
import { User } from '../types'

export function useUserOperations(token: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateUser = async (userId: string, data: Partial<User>) => {
    setLoading(true)
    setError('')

    try {
      const result = await api.users.update(userId, data, token)
      if (result.success) {
        return { success: true, user: result.user }
      }
      setError(result.error || 'Failed to update user')
      return { success: false, error: result.error }
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Network error'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId: string) => {
    setLoading(true)
    setError('')

    try {
      const result = await api.users.delete(userId, token)
      if (result.success) {
        return { success: true }
      }
      setError(result.error || 'Failed to delete user')
      return { success: false, error: result.error }
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Network error'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async (userId: string, password: string) => {
    setLoading(true)
    setError('')

    try {
      const result = await api.users.changePassword(userId, password, token)
      if (result.success) {
        return { success: true }
      }
      setError(result.error || 'Failed to change password')
      return { success: false, error: result.error }
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Network error'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (userData: {
    username: string
    password: string
    name: string
    role: 'admin' | 'leader' | 'user'
    teamId?: string
    teamName?: string
    teamToken?: string
  }) => {
    setLoading(true)
    setError('')

    try {
      const result = await api.users.create(userData, token)
      if (result.success) {
        return { success: true, user: result.user }
      }
      setError(result.error || 'Failed to create user')
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
    updateUser,
    deleteUser,
    changePassword,
    createUser,
    loading,
    error,
  }
}
