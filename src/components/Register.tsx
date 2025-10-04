import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Register.css';

interface RegisterFormData {
  name: string;
  telegram_username: string;
  role: 'admin' | 'supervisor' | 'team_member';
  supervisor_id?: number;
}

export default function Register() {
  const { user, isAdmin, isSupervisor } = useAuth();
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    telegram_username: '',
    role: 'team_member',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('leavebot_token');
      
      if (!token) {
        setError('Authentication required. Please login again.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to register user');
        setIsLoading(false);
        return;
      }

      setSuccess(`User ${data.user.name} (@${data.user.telegram_username}) registered successfully as ${data.user.role}!`);
      
      // Reset form
      setFormData({
        name: '',
        telegram_username: '',
        role: 'team_member',
      });
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof RegisterFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isAdmin && !isSupervisor) {
    return (
      <div className="register-container">
        <div className="register-card">
          <div className="access-denied">
            <h2>🚫 Access Denied</h2>
            <p>Only admins and supervisors can register new users.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h2>👥 Register New User</h2>
          <p>Add a new team member, supervisor, or admin</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="John Doe"
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="telegram_username">Telegram Username</label>
            <div className={`input-wrapper ${isLoading ? 'disabled' : ''}`}>
              <span className="input-prefix">@</span>
              <input
                id="telegram_username"
                type="text"
                value={formData.telegram_username}
                onChange={(e) => handleChange('telegram_username', e.target.value)}
                placeholder="username"
                disabled={isLoading}
                required
              />
            </div>
            <small className="input-hint">
              Without the @ symbol
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value as RegisterFormData['role'])}
              disabled={isLoading || !isAdmin}
              required
            >
              {isAdmin && <option value="admin">Admin (Full Access)</option>}
              {isAdmin && <option value="supervisor">Supervisor (Team Manager)</option>}
              <option value="team_member">Team Member (Standard User)</option>
            </select>
            <small className="input-hint">
              {!isAdmin && 'Supervisors can only register team members'}
            </small>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <button type="submit" disabled={isLoading} className="register-button">
            {isLoading ? 'Registering...' : 'Register User'}
          </button>
        </form>

        <div className="register-info">
          <h3>📋 Role Permissions</h3>
          <ul>
            <li><strong>Admin:</strong> Full system access, can register anyone</li>
            <li><strong>Supervisor:</strong> Manage team members, approve their leave</li>
            <li><strong>Team Member:</strong> Submit and view own leave requests</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
