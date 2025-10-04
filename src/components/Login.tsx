import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'username' | 'otp'>('username');
  const [userInfo, setUserInfo] = useState<any>(null);
  const { login } = useAuth();

  const handleUsernameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username.trim()) {
      setError('Please enter your Telegram username');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_username: username.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send verification code');
        if (data.hint) {
          setError(`${data.error}\n\n${data.hint}`);
        }
        setIsLoading(false);
        return;
      }

      setUserInfo(data.user);
      setStep('otp');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!otp.trim()) {
      setError('Please enter the verification code');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          telegram_username: username.trim(),
          otp: otp.trim() 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid verification code');
        if (data.hint) {
          setError(`${data.error}. ${data.hint}`);
        }
        setIsLoading(false);
        return;
      }

      // Store user data and token
      localStorage.setItem('leavebot_user', JSON.stringify(data.user));
      localStorage.setItem('leavebot_token', data.token);
      
      // Trigger login in AuthContext
      const success = await login(username.trim());
      
      if (!success) {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setOtp('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_username: username.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to resend code');
        setIsLoading(false);
        return;
      }

      setError('');
      alert('New verification code sent to your Telegram!');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('username');
    setOtp('');
    setError('');
    setUserInfo(null);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🗓️ LeaveBot</h1>
          <p>Employee Leave Management System</p>
        </div>

        {step === 'username' ? (
          <form onSubmit={handleUsernameSubmit} className="login-form">
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
              {isLoading ? 'Sending code...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="login-form">
            <div className="otp-info">
              <p className="otp-sent-message">
                � Verification code sent to <strong>@{username}</strong> on Telegram
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="otp">Verification Code</label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                disabled={isLoading}
                autoFocus
                maxLength={6}
                className="otp-input"
                autoComplete="one-time-code"
              />
              <small className="input-hint">
                Enter the 6-digit code from Telegram
              </small>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="login-button">
              {isLoading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <div className="otp-actions">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="link-button"
              >
                Resend Code
              </button>
              <span className="separator">•</span>
              <button
                type="button"
                onClick={handleBack}
                disabled={isLoading}
                className="link-button"
              >
                Change Username
              </button>
            </div>
          </form>
        )}

        <div className="login-footer">
          <p>
            🔒 Two-factor authentication via Telegram
          </p>
        </div>
      </div>
    </div>
  );
}
