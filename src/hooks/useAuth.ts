/**
 * Custom hook for authentication
 */

import { useState, useEffect } from 'react'
import { api, ApiError } from '../utils/api'
import { User } from '../types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load user from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)

        // Migration: Force re-login if user.id is undefined
        if (!parsedUser.id || parsedUser.id === 'undefined') {
          console.log('Invalid user ID detected, clearing session...')
          logout()
          setError('Please log in again to continue')
          setLoading(false)
          return
        }

        setToken(savedToken)
        setUser(parsedUser)
      } catch (err) {
        console.error('Failed to parse saved user:', err)
        logout()
      }
    }

    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    setLoading(true)
    setError('')

    try {
      // Clean username (remove @ prefix)
      const cleanUsername = username.replace(/^@+/, '')

      const data = await api.auth.login(cleanUsername, password)

      if (data.success && data.token && data.user) {
        const userWithId = {
          ...data.user,
          id: data.user.id || data.user._id,
        }

        setToken(data.token)
        setUser(userWithId)

        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(userWithId))

        return { success: true }
      }

      setError(data.error || 'Login failed')
      return { success: false, error: data.error }
    } catch (err) {
      const errorMsg =
        err instanceof ApiError
          ? err.message
          : 'Network error. Please check your connection.'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const register = async (
    username: string,
    password: string,
    name: string,
    role?: 'user' | 'leader',
    teamId?: string,
    teamToken?: string,
    teamName?: string
  ) => {
    setLoading(true)
    setError('')

    try {
      // Clean username (remove @ prefix)
      const cleanUsername = username.replace(/^@+/, '')

      const data = await api.auth.register(cleanUsername, password, name, teamId, teamToken, teamName)

      if (data.success && data.token && data.user) {
        const userWithId = {
          ...data.user,
          id: data.user.id || data.user._id,
        }

        setToken(data.token)
        setUser(userWithId)

        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(userWithId))

        return { success: true }
      }

      setError(data.error || 'Registration failed')
      return { success: false, error: data.error }
    } catch (err) {
      const errorMsg =
        err instanceof ApiError
          ? err.message
          : 'Network error. Please check your connection.'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken('')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
  }
}
