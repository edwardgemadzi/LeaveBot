import React from 'react';
import { AuthFormField } from './AuthFormField';
import { TeamSelector } from './TeamSelector';
import { AuthSubmitButton } from './AuthSubmitButton';

interface Team {
  id?: string;
  _id?: string;
  name: string;
}

interface AuthFormProps {
  isRegistering: boolean;
  loading: boolean;
  teams: Team[];
  formData: {
    name: string;
    username: string;
    password: string;
    role: 'user' | 'leader';
    selectedTeamId: string;
    teamToken: string;
    teamName: string;
  };
  onFormDataChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  isRegistering,
  loading,
  teams,
  formData,
  onFormDataChange,
  onSubmit
}) => {
  return (
    <form onSubmit={onSubmit}>
      {isRegistering && (
        <AuthFormField
          label="Full Name"
          type="text"
          value={formData.name}
          onChange={(value) => onFormDataChange('name', value)}
          placeholder="John Doe"
          required={isRegistering}
          disabled={loading}
        />
      )}

      <AuthFormField
        label="Username"
        type="text"
        value={formData.username}
        onChange={(value) => onFormDataChange('username', value)}
        placeholder="@username"
        required
        disabled={loading}
      />

      <AuthFormField
        label="Password"
        type="password"
        value={formData.password}
        onChange={(value) => onFormDataChange('password', value)}
        placeholder="Enter your password"
        required
        disabled={loading}
        minLength={isRegistering ? 8 : undefined}
        helpText={isRegistering ? 'Minimum 8 characters' : undefined}
      />

      {isRegistering && (
        <AuthFormField
          label="Role"
          type="select"
          value={formData.role}
          onChange={(value) => onFormDataChange('role', value)}
          placeholder="Select your role"
          required
          disabled={loading}
          options={[
            { value: 'user', label: 'User' },
            { value: 'leader', label: 'Supervisor' }
          ]}
          helpText="Choose your role: User (team member) or Supervisor (team leader)"
        />
      )}

      {isRegistering && formData.role === 'leader' && (
        <AuthFormField
          label="Team Name"
          type="text"
          value={formData.teamName}
          onChange={(value) => onFormDataChange('teamName', value)}
          placeholder="Enter your team name (e.g., Marketing Team)"
          required
          disabled={loading}
          helpText="A new team will be created for you as supervisor"
        />
      )}

      {isRegistering && formData.role === 'user' && (
        <TeamSelector
          teams={teams}
          selectedTeamId={formData.selectedTeamId}
          onTeamChange={(teamId) => onFormDataChange('selectedTeamId', teamId)}
          disabled={loading}
        />
      )}

      {isRegistering && (
        <AuthFormField
          label="Team Registration Token"
          type="text"
          value={formData.teamToken}
          onChange={(value) => onFormDataChange('teamToken', value)}
          placeholder="Enter team token provided by your team leader"
          required={false}
          disabled={loading}
          helpText="Get this token from your team leader or admin to join their team"
        />
      )}

      <AuthSubmitButton
        isRegistering={isRegistering}
        loading={loading}
      />
    </form>
  );
};
