import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username.trim()) {
      setError('Please enter your Telegram username');
      setIsLoading(false);
      return;
    }

    const success = await login(username.trim());
    
    if (!success) {
      setError('Invalid username. Please contact your administrator.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🗓️ LeaveBot</h1>
          <p>Employee Leave Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Telegram Username</label>
            <div className="input-wrapper">
              <span className="input-prefix">@</span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                disabled={isLoading}
                autoFocus
                autoComplete="username"
              />
            </div>
            <small className="input-hint">
              Enter your Telegram username (without @)
            </small>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button type="submit" disabled={isLoading} className="login-button">
            {isLoading ? 'Logging in...' : 'Login with Telegram'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            🔒 Secure access for registered team members only
          </p>
        </div>
      </div>
    </div>
  );
}
