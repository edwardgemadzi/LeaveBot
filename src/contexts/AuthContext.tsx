import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  username: string
  name: string
  role: 'admin' | 'leader' | 'user'
  teamId?: string
}

interface UserSettings {
  shiftPattern: {
    type: string
    customPattern?: string
    referenceDate?: string
  }
  shiftTime: {
    type: string
    customStart?: string
    customEnd?: string
  }
  workingDays: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
}

interface AuthContextType {
  user: User | null
  token: string
  userSettings: UserSettings | null
  loading: boolean
  error: string
  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, password: string, name: string, teamId?: string) => Promise<boolean>
  logout: () => void
  loadUserSettings: () => Promise<void>
  setError: (error: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string>('')
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(false)
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
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setError('Please log in again to continue')
          return
        }
        
        setToken(savedToken)
        setUser(parsedUser)
        loadUserSettingsInternal(parsedUser.id, savedToken)
      } catch (err) {
        console.error('Failed to parse saved user:', err)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  }, [])

  const loadUserSettingsInternal = async (userId: string, authToken: string) => {
    try {
      const res = await fetch(`/api/users?id=${userId}&action=settings`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.settings) {
          setUserSettings(data.settings)
        }
      }
    } catch (err) {
      console.error('Failed to load user settings:', err)
    }
  }

  const loadUserSettings = async () => {
    if (user && token) {
      await loadUserSettingsInternal(user.id, token)
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    setError('')
    setLoading(true)
    
    // Strip @ symbol if user included it
    const cleanUsername = username.replace(/^@+/, '')
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token)
        loadUserSettingsInternal(data.user.id, data.token)
        return true
      } else {
        setError(data.error || 'Login failed')
        return false
      }
    } catch (err) {
      setError('Network error. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const register = async (username: string, password: string, name: string, teamId?: string): Promise<boolean> => {
    setError('')
    setLoading(true)
    
    // Strip @ symbol if user included it
    const cleanUsername = username.replace(/^@+/, '')
    
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: cleanUsername, 
          password, 
          name,
          ...(teamId && { teamId })
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token)
        loadUserSettingsInternal(data.user.id, data.token)
        return true
      } else {
        setError(data.error || 'Registration failed')
        return false
      }
    } catch (err) {
      setError('Network error. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken('')
    setUserSettings(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      userSettings,
      loading,
      error,
      login,
      register,
      logout,
      loadUserSettings,
      setError
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
