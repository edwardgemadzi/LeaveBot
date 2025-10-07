import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface Leave {
  _id: string
  employeeName: string
  userId: string
  startDate: string
  endDate: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  workingDaysCount?: number
  calendarDaysCount?: number
  shiftPattern?: string
  shiftTime?: string
}

interface LeavesContextType {
  leaves: Leave[]
  loading: boolean
  error: string
  loadLeaves: () => Promise<void>
  requestLeave: (startDate: string, endDate: string, reason: string, employeeName: string) => Promise<boolean>
  calculateDays: (startDate: string, endDate: string) => Promise<{
    workingDays: number
    calendarDays: number
    warning: string | null
    shiftPattern?: string
    shiftTime?: string
  } | null>
  setError: (error: string) => void
}

const LeavesContext = createContext<LeavesContextType | undefined>(undefined)

export function LeavesProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth()
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auto-refresh leaves every 30 seconds for real-time sync
  useEffect(() => {
    if (!token || !user) return
    
    loadLeaves()
    
    const interval = setInterval(() => {
      loadLeaves()
    }, 30000) // 30 seconds
    
    return () => clearInterval(interval)
  }, [token, user])

  const loadLeaves = async (customToken?: string) => {
    const authToken = customToken || token
    if (!authToken) return
    
    setLoading(true)
    try {
      const res = await fetch('/api/leaves', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        setLeaves(data.leaves || [])
      } else {
        setError(data.error || 'Failed to load leaves')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const requestLeave = async (
    startDate: string, 
    endDate: string, 
    reason: string, 
    employeeName: string
  ): Promise<boolean> => {
    if (!token) return false
    
    setError('')
    setLoading(true)
    
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ employeeName, startDate, endDate, reason })
      })
      
      const data = await res.json()
      
      if (data.success) {
        await loadLeaves()
        return true
      } else {
        setError(data.error || 'Failed to submit leave request')
        return false
      }
    } catch (err) {
      setError('Network error. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const calculateDays = async (startDate: string, endDate: string) => {
    if (!token || !startDate || !endDate) return null
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (end < start) return null
    
    try {
      const res = await fetch('/api/leaves?action=calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ startDate, endDate })
      })
      
      if (res.ok) {
        const data = await res.json()
        return {
          workingDays: data.workingDays,
          calendarDays: data.calendarDays,
          warning: data.warning,
          shiftPattern: data.shiftPattern,
          shiftTime: data.shiftTime
        }
      }
    } catch (err) {
      console.error('Failed to calculate working days:', err)
    }
    
    return null
  }

  return (
    <LeavesContext.Provider value={{
      leaves,
      loading,
      error,
      loadLeaves,
      requestLeave,
      calculateDays,
      setError
    }}>
      {children}
    </LeavesContext.Provider>
  )
}

export function useLeaves() {
  const context = useContext(LeavesContext)
  if (context === undefined) {
    throw new Error('useLeaves must be used within a LeavesProvider')
  }
  return context
}
