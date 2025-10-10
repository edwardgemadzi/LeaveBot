/**
 * Authentication Component - Login and Registration
 */

import { useState, useEffect } from 'react'
import { useTeams } from '../../hooks/useTeams'
import { AuthLayout, AuthHeader, AuthError, AuthForm, AuthToggle } from './index'

interface AuthenticationProps {
  onLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  onRegister: (
    username: string,
    password: string,
    name: string,
    teamId?: string,
    teamToken?: string
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
  const [teamToken, setTeamToken] = useState('')
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

    const result = await onRegister(username, password, name, selectedTeamId || undefined, teamToken || undefined)
    if (!result.success) {
      setLocalError(result.error || 'Registration failed')
    }
  }

  useEffect(() => {
    setLocalError('')
  }, [isRegistering])

  const formData = {
    name,
    username,
    password,
    selectedTeamId,
    teamToken
  };

  const handleFormDataChange = (field: string, value: string) => {
    switch (field) {
      case 'name':
        setName(value);
        break;
      case 'username':
        setUsername(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'selectedTeamId':
        setSelectedTeamId(value);
        break;
      case 'teamToken':
        setTeamToken(value);
        break;
    }
  };

  const handleToggle = () => {
    setIsRegistering(!isRegistering);
    setLocalError('');
  };

  return (
    <AuthLayout>
      <AuthHeader isRegistering={isRegistering} />
      
      <AuthError error={error} localError={localError} />
      
      <AuthForm
        isRegistering={isRegistering}
        loading={loading}
        teams={teams}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        onSubmit={isRegistering ? handleRegister : handleLogin}
      />
      
      <AuthToggle
        isRegistering={isRegistering}
        loading={loading}
        onToggle={handleToggle}
      />
    </AuthLayout>
  )
}
