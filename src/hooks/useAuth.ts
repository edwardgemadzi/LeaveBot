import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../services/api';
import { User, LoginRequest, RegisterRequest } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setAuthState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        });
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      const response = await api.auth.login(credentials);
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        
        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        setAuthState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        });
        
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  const register = useCallback(async (userData: RegisterRequest) => {
    try {
      const response = await api.auth.register(userData);
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        
        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        setAuthState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        });
        
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setAuthState(prev => ({
      ...prev,
      user: updatedUser,
    }));
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  return {
    ...authState,
    login,
    register,
    logout,
    updateUser,
  };
}
