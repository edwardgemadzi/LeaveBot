// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  LEADER: 'leader',
  USER: 'user'
} as const;

// Leave Status
export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

// Leave Types
export const LEAVE_TYPES = {
  ANNUAL: 'annual',
  SICK: 'sick',
  PERSONAL: 'personal',
  EMERGENCY: 'emergency',
  MATERNITY: 'maternity',
  PATERNITY: 'paternity',
  STUDY: 'study',
  UNPAID: 'unpaid'
} as const;

// Shift Patterns
export const SHIFT_PATTERNS = {
  REGULAR: 'regular',
  TWO_TWO: '2-2',
  THREE_THREE: '3-3',
  FOUR_FOUR: '4-4',
  FIVE_FIVE: '5-5',
  CUSTOM: 'custom'
} as const;

// Shift Times
export const SHIFT_TIMES = {
  DAY: 'day',
  NIGHT: 'night',
  ROTATING: 'rotating'
} as const;

// Working Days
export const WORKING_DAYS = {
  MONDAY: 'monday',
  TUESDAY: 'tuesday',
  WEDNESDAY: 'wednesday',
  THURSDAY: 'thursday',
  FRIDAY: 'friday',
  SATURDAY: 'saturday',
  SUNDAY: 'sunday'
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/login',
    REGISTER: '/api/register'
  },
  USERS: {
    BASE: '/api/users',
    SETTINGS: '/api/users/settings'
  },
  LEAVES: {
    BASE: '/api/leaves',
    CALCULATE: '/api/leaves?action=calculate'
  },
  TEAMS: {
    BASE: '/api/teams',
    SETTINGS: '/api/teams/settings'
  },
  BALANCE: {
    BASE: '/api/balance'
  }
} as const;

// Calendar Views
export const CALENDAR_VIEWS = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day',
  AGENDA: 'agenda'
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  API: 'yyyy-MM-dd',
  CALENDAR: 'yyyy-MM-dd',
  TIME: 'HH:mm'
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  NAME_MAX_LENGTH: 100,
  REASON_MAX_LENGTH: 500,
  TEAM_NAME_MAX_LENGTH: 100,
  TEAM_DESCRIPTION_MAX_LENGTH: 500
} as const;

// UI Constants
export const UI_CONSTANTS = {
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  PAGINATION_SIZE: 10,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
} as const;

// Color Themes
export const COLOR_THEMES = {
  PRIMARY: '#6366f1',
  SECONDARY: '#64748b',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6'
} as const;

// Status Colors
export const STATUS_COLORS = {
  [LEAVE_STATUS.PENDING]: {
    bg: '#fef3c7',
    text: '#92400e',
    border: '#f59e0b'
  },
  [LEAVE_STATUS.APPROVED]: {
    bg: '#d1fae5',
    text: '#065f46',
    border: '#10b981'
  },
  [LEAVE_STATUS.REJECTED]: {
    bg: '#fee2e2',
    text: '#991b1b',
    border: '#ef4444'
  }
} as const;

// Leave Type Colors
export const LEAVE_TYPE_COLORS = {
  [LEAVE_TYPES.ANNUAL]: '#3b82f6',
  [LEAVE_TYPES.SICK]: '#ef4444',
  [LEAVE_TYPES.PERSONAL]: '#8b5cf6',
  [LEAVE_TYPES.EMERGENCY]: '#f59e0b',
  [LEAVE_TYPES.MATERNITY]: '#ec4899',
  [LEAVE_TYPES.PATERNITY]: '#06b6d4',
  [LEAVE_TYPES.STUDY]: '#10b981',
  [LEAVE_TYPES.UNPAID]: '#6b7280'
} as const;
