import { createContext, useContext, useState, ReactNode } from 'react'

interface Team {
  _id: string
  name: string
  leaderId?: string
  createdAt: string
}

interface TeamsContextType {
  teams: Team[]
  loading: boolean
  error: string
  loadTeams: () => Promise<void>
  setError: (error: string) => void
}

const TeamsContext = createContext<TeamsContextType | undefined>(undefined)

export function TeamsProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadTeams = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teams')
      if (res.ok) {
        const data = await res.json()
        setTeams(data.teams || [])
      } else {
        setError('Failed to load teams')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <TeamsContext.Provider value={{
      teams,
      loading,
      error,
      loadTeams,
      setError
    }}>
      {children}
    </TeamsContext.Provider>
  )
}

export function useTeams() {
  const context = useContext(TeamsContext)
  if (context === undefined) {
    throw new Error('useTeams must be used within a TeamsProvider')
  }
  return context
}
