/**
 * Custom hook for fetching users
 */

import { useState, useEffect } from 'react'
import { api, ApiError } from '../utils/api'
import { User } from '../types'

export function useUsers(token: string, autoLoad = true) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const loadUsers = async () => {
    if (!token) return

    setLoading(true)
    setError('')

    try {
      const data = await api.users.getAll(token)
      if (data.success) {
        setUsers(data.users)
      } else {
        setError(data.error || 'Failed to load users')
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
      loadUsers()
    }
  }, [token, autoLoad])

  return { users, loading, error, refetch: loadUsers }
}
