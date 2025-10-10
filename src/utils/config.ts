import { API_CONFIG, UI_CONFIG, VALIDATION_CONFIG, DEFAULT_SETTINGS, ENV_CONFIG } from '../config';

// API Configuration Helpers
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export const getApiTimeout = (): number => {
  return API_CONFIG.TIMEOUT;
};

export const getRetryConfig = () => {
  return {
    attempts: API_CONFIG.RETRY_ATTEMPTS,
    delay: API_CONFIG.RETRY_DELAY
  };
};

// UI Configuration Helpers
export const getToastDuration = (): number => {
  return UI_CONFIG.TOAST_DURATION;
};

export const getDebounceDelay = (): number => {
  return UI_CONFIG.DEBOUNCE_DELAY;
};

export const getAnimationDuration = (): number => {
  return UI_CONFIG.ANIMATION_DURATION;
};

export const getPaginationSize = (): number => {
  return UI_CONFIG.PAGINATION_SIZE;
};

// Validation Configuration Helpers
export const getPasswordMinLength = (): number => {
  return VALIDATION_CONFIG.PASSWORD_MIN_LENGTH;
};

export const getUsernameMinLength = (): number => {
  return VALIDATION_CONFIG.USERNAME_MIN_LENGTH;
};

export const getUsernameMaxLength = (): number => {
  return VALIDATION_CONFIG.USERNAME_MAX_LENGTH;
};

export const getNameMaxLength = (): number => {
  return VALIDATION_CONFIG.NAME_MAX_LENGTH;
};

export const getReasonMaxLength = (): number => {
  return VALIDATION_CONFIG.REASON_MAX_LENGTH;
};

export const getTeamNameMaxLength = (): number => {
  return VALIDATION_CONFIG.TEAM_NAME_MAX_LENGTH;
};

export const getTeamDescriptionMaxLength = (): number => {
  return VALIDATION_CONFIG.TEAM_DESCRIPTION_MAX_LENGTH;
};

// Default Settings Helpers
export const getDefaultUserSettings = () => {
  return { ...DEFAULT_SETTINGS.USER };
};

export const getDefaultTeamSettings = () => {
  return { ...DEFAULT_SETTINGS.TEAM };
};

export const getDefaultSystemSettings = () => {
  return { ...DEFAULT_SETTINGS.SYSTEM };
};

// Environment Helpers
export const isDevelopment = (): boolean => {
  return ENV_CONFIG.NODE_ENV === 'development';
};

export const isProduction = (): boolean => {
  return ENV_CONFIG.NODE_ENV === 'production';
};

export const isTest = (): boolean => {
  return ENV_CONFIG.NODE_ENV === 'test';
};
