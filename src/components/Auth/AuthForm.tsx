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
    selectedTeamId: string;
    teamToken: string;
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
