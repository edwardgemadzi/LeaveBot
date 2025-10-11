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
    console.log('🔄 Initializing auth state...');
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('✅ Found stored auth data:', user.username);
        setAuthState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        });
        console.log('🎉 User authenticated from storage');
      } catch (error) {
        console.log('❌ Invalid stored auth data, clearing...');
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
      console.log('ℹ️ No stored auth data found');
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      console.log('🔐 Attempting login for:', credentials.username);
      const response = await api.auth.login(credentials);
      console.log('📡 Login response:', response);
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        console.log('✅ Login successful, storing auth data');
        
        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        setAuthState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        });
        
        console.log('🎉 Auth state updated, user authenticated');
        return { success: true };
      } else {
        console.log('❌ Login failed:', response.error);
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      console.error('💥 Login error:', error);
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
    console.log('🚪 Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
    console.log('✅ User logged out successfully');
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
