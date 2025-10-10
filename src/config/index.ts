import { API_ENDPOINTS, UI_CONSTANTS, VALIDATION_RULES } from '../constants';

// Environment Configuration
export const ENV_CONFIG = {
  NODE_ENV: 'development',
  API_BASE_URL: '',
  APP_NAME: 'LeaveBot',
  VERSION: '1.0.0'
} as const;

// API Configuration
export const API_CONFIG = {
  BASE_URL: ENV_CONFIG.API_BASE_URL,
  ENDPOINTS: API_ENDPOINTS,
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
} as const;

// UI Configuration
export const UI_CONFIG = {
  TOAST_DURATION: UI_CONSTANTS.TOAST_DURATION,
  DEBOUNCE_DELAY: UI_CONSTANTS.DEBOUNCE_DELAY,
  ANIMATION_DURATION: UI_CONSTANTS.ANIMATION_DURATION,
  PAGINATION_SIZE: UI_CONSTANTS.PAGINATION_SIZE,
  THEME: {
    PRIMARY: '#6366f1',
    SECONDARY: '#64748b',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    INFO: '#3b82f6'
  }
} as const;

// Validation Configuration
export const VALIDATION_CONFIG = {
  PASSWORD_MIN_LENGTH: VALIDATION_RULES.PASSWORD_MIN_LENGTH,
  USERNAME_MIN_LENGTH: VALIDATION_RULES.USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH: VALIDATION_RULES.USERNAME_MAX_LENGTH,
  NAME_MAX_LENGTH: VALIDATION_RULES.NAME_MAX_LENGTH,
  REASON_MAX_LENGTH: VALIDATION_RULES.REASON_MAX_LENGTH,
  TEAM_NAME_MAX_LENGTH: VALIDATION_RULES.TEAM_NAME_MAX_LENGTH,
  TEAM_DESCRIPTION_MAX_LENGTH: VALIDATION_RULES.TEAM_DESCRIPTION_MAX_LENGTH
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_TEAM_MANAGEMENT: true,
  ENABLE_LEAVE_CALCULATION: true,
  ENABLE_CONCURRENT_LEAVE_CHECK: true,
  ENABLE_LEAVE_BALANCE_TRACKING: true,
  ENABLE_USER_SETTINGS: true,
  ENABLE_TEAM_SETTINGS: true,
  ENABLE_LEAVE_APPROVAL: true,
  ENABLE_LEAVE_REJECTION: true,
  ENABLE_LEAVE_DELETION: true,
  ENABLE_PASSWORD_CHANGE: true,
  ENABLE_USER_PROFILE: true
} as const;

// Default Settings
export const DEFAULT_SETTINGS = {
  USER: {
    SHIFT_PATTERN: 'regular',
    SHIFT_TIME: 'day',
    WORKING_DAYS: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    REFERENCE_DATE: new Date().toISOString().split('T')[0]
  },
  TEAM: {
    CONCURRENT_LEAVE_LIMIT: 2,
    ANNUAL_LEAVE_DAYS: 20,
    DEFAULT_SHIFT_PATTERN: 'regular',
    DEFAULT_SHIFT_TIME: 'day',
    DEFAULT_WORKING_DAYS: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  SYSTEM: {
    AUTO_REFRESH_INTERVAL: 30000, // 30 seconds
    SESSION_TIMEOUT: 3600000, // 1 hour
    MAX_LEAVE_DURATION: 30, // 30 days
    MIN_LEAVE_DURATION: 0.5 // 0.5 days (half day)
  }
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Registration successful!',
  LEAVE_CREATED: 'Leave request created successfully!',
  LEAVE_UPDATED: 'Leave request updated successfully!',
  LEAVE_DELETED: 'Leave request deleted successfully!',
  LEAVE_APPROVED: 'Leave request approved!',
  LEAVE_REJECTED: 'Leave request rejected!',
  USER_CREATED: 'User created successfully!',
  USER_UPDATED: 'User updated successfully!',
  USER_DELETED: 'User deleted successfully!',
  TEAM_CREATED: 'Team created successfully!',
  TEAM_UPDATED: 'Team updated successfully!',
  TEAM_DELETED: 'Team deleted successfully!',
  SETTINGS_UPDATED: 'Settings updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!'
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'leavebot_auth_token',
  USER_PREFERENCES: 'leavebot_user_preferences',
  THEME: 'leavebot_theme',
  LANGUAGE: 'leavebot_language'
} as const;
