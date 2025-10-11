import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../shared/Button';
import Input from '../shared/Input';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'user' as 'admin' | 'leader' | 'user',
    teamToken: '',
    teamName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.role === 'user' && !formData.teamToken.trim()) {
      newErrors.teamToken = 'Team token is required for team members';
    }

    if (formData.role === 'leader' && !formData.teamName.trim()) {
      newErrors.teamName = 'Team name is required for team leaders';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const registerData = {
        username: formData.username,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        ...(formData.role === 'user' && { teamToken: formData.teamToken }),
        ...(formData.role === 'leader' && { teamName: formData.teamName }),
      };

      const result = await register(registerData);
      
      if (result.success) {
        onSuccess?.();
      } else {
        setErrors({ general: result.error || 'Registration failed' });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
        <p className="mt-2 text-gray-600">Join the leave management system</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <Input
            label="Username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleInputChange}
            error={errors.username}
            placeholder="Choose a username"
            autoComplete="username"
            required
          />

          <Input
            label="Full Name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            error={errors.name}
            placeholder="Enter your full name"
            autoComplete="name"
            required
          />

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="user">Team Member</option>
              <option value="leader">Team Leader</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              {formData.role === 'user' 
                ? 'You will need a team token from your team leader'
                : 'You will create a new team'
              }
            </p>
          </div>

          {formData.role === 'user' && (
            <Input
              label="Team Registration Token"
              name="teamToken"
              type="text"
              value={formData.teamToken}
              onChange={handleInputChange}
              error={errors.teamToken}
              placeholder="Enter team token from your leader"
              helperText="Get this token from your team leader"
              required
            />
          )}

          {formData.role === 'leader' && (
            <Input
              label="Team Name"
              name="teamName"
              type="text"
              value={formData.teamName}
              onChange={handleInputChange}
              error={errors.teamName}
              placeholder="Enter your team name"
              helperText="This will be the name of your team"
              required
            />
          )}

          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            placeholder="Create a password"
            autoComplete="new-password"
            required
          />

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={errors.confirmPassword}
            placeholder="Confirm your password"
            autoComplete="new-password"
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={isLoading}
          disabled={isLoading}
        >
          Create Account
        </Button>
      </form>

      {onSwitchToLogin && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
