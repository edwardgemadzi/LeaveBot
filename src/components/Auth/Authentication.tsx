/**
 * Authentication Component - Login and Registration
 */

import { useState, useEffect } from 'react'
import { useTeams } from '../../hooks/useTeams'

interface AuthenticationProps {
  onLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  onRegister: (
    username: string,
    password: string,
    name: string,
    teamId?: string
  ) => Promise<{ success: boolean; error?: string }>
  loading: boolean
  error: string
}

export default function Authentication({
  onLogin,
  onRegister,
  loading,
  error,
}: AuthenticationProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [localError, setLocalError] = useState('')

  const { teams } = useTeams('', !isRegistering)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    const result = await onLogin(username, password)
    if (!result.success) {
      setLocalError(result.error || 'Login failed')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    const result = await onRegister(username, password, name, selectedTeamId || undefined)
    if (!result.success) {
      setLocalError(result.error || 'Registration failed')
    }
  }

  useEffect(() => {
    setLocalError('')
  }, [isRegistering])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          padding: '40px',
          maxWidth: '450px',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1
            style={{
              margin: '0 0 10px 0',
              fontSize: '32px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            🌴 LeaveBot
          </h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
            {isRegistering ? 'Create your account' : 'Welcome back!'}
          </p>
        </div>

        {(error || localError) && (
          <div
            style={{
              padding: '12px',
              background: '#fee2e2',
              color: '#991b1b',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #fecaca',
              fontSize: '14px',
            }}
          >
            {error || localError}
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          {isRegistering && (
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#374151',
                  fontWeight: '500',
                }}
              >
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required={isRegistering}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#374151',
                fontWeight: '500',
              }}
            >
              Username *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@username"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#374151',
                fontWeight: '500',
              }}
            >
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
              minLength={isRegistering ? 8 : undefined}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
            {isRegistering && (
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                Minimum 8 characters
              </p>
            )}
          </div>

          {isRegistering && teams.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#374151',
                  fontWeight: '500',
                }}
              >
                Team (Optional)
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <option value="">No team</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading
                ? '#9ca3af'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '15px',
            }}
          >
            {loading
              ? isRegistering
                ? 'Creating account...'
                : 'Logging in...'
              : isRegistering
              ? 'Create Account'
              : 'Login'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => {
              setIsRegistering(!isRegistering)
              setLocalError('')
            }}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              textDecoration: 'underline',
            }}
          >
            {isRegistering
              ? 'Already have an account? Login'
              : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  )
}
