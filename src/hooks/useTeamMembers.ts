import { useEffect, useState } from 'react'
import { api } from '../utils/api'

interface MinimalUser {
  id?: string
  _id?: string
  username: string
  name: string
  role: 'admin' | 'leader' | 'user'
}

export function useTeamMembers(token?: string, enabled = false) {
  const [members, setMembers] = useState<MinimalUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!enabled || !token) return

    let isCancelled = false
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await api.users.getAll(token)
        if (!isCancelled && data?.success) {
          const users = (data.users as MinimalUser[]).filter(u => u.role === 'user')
          setMembers(users)
        }
      } catch (err: any) {
        if (!isCancelled) setError(err.message || 'Failed to load team members')
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    load()

    return () => {
      isCancelled = true
      controller.abort()
    }
  }, [token, enabled])

  return { members, loading, error }
}


