// Input validation utilities

/**
 * Validate username format
 */
export function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }

  const trimmed = username.trim();
  
  if (trimmed.length < 3 || trimmed.length > 50) {
    return { valid: false, error: 'Username must be 3-50 characters' };
  }

  // Allow alphanumeric, underscore, hyphen, no @ symbol
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscore, and hyphen' };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate password strength
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password is too long (max 128 characters)' };
  }

  return { valid: true, value: password };
}

/**
 * Validate user role
 */
export function validateRole(role, allowedRoles = ['admin', 'leader', 'user']) {
  if (!role || typeof role !== 'string') {
    return { valid: false, error: 'Role is required' };
  }

  if (!allowedRoles.includes(role)) {
    return { valid: false, error: `Role must be one of: ${allowedRoles.join(', ')}` };
  }

  return { valid: true, value: role };
}

/**
 * Validate and sanitize name
 */
export function validateName(name, required = true) {
  if (!name || typeof name !== 'string') {
    if (required) {
      return { valid: false, error: 'Name is required' };
    }
    return { valid: true, value: '' };
  }

  const trimmed = name.trim();
  
  if (trimmed.length < 2 || trimmed.length > 100) {
    return { valid: false, error: 'Name must be 2-100 characters' };
  }

  // Remove any potentially dangerous characters
  const sanitized = trimmed.replace(/[<>\"']/g, '');
  
  return { valid: true, value: sanitized };
}

/**
 * Validate team name
 */
export function validateTeamName(teamName) {
  if (!teamName || typeof teamName !== 'string') {
    return { valid: false, error: 'Team name is required' };
  }

  const trimmed = teamName.trim();
  
  if (trimmed.length < 2 || trimmed.length > 100) {
    return { valid: false, error: 'Team name must be 2-100 characters' };
  }

  const sanitized = trimmed.replace(/[<>\"']/g, '');
  
  return { valid: true, value: sanitized };
}

/**
 * Validate MongoDB ObjectId format
 */
export function validateObjectId(id) {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'ID is required' };
  }

  // MongoDB ObjectId is 24 hex characters
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return { valid: false, error: 'Invalid ID format' };
  }

  return { valid: true, value: id };
}

/**
 * Validate date string
 */
export function validateDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return { valid: false, error: 'Date is required' };
  }

  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  return { valid: true, value: date };
}

/**
 * Validate leave balance amount
 */
export function validateBalance(amount) {
  if (typeof amount !== 'number') {
    return { valid: false, error: 'Balance must be a number' };
  }

  if (amount < 0) {
    return { valid: false, error: 'Balance cannot be negative' };
  }

  if (amount > 365) {
    return { valid: false, error: 'Balance cannot exceed 365 days' };
  }

  return { valid: true, value: amount };
}

/**
 * Validate leave type
 */
export function validateLeaveType(leaveType) {
  if (!leaveType || typeof leaveType !== 'string') {
    return { valid: false, error: 'Leave type is required' };
  }

  const validTypes = ['annual', 'sick', 'personal', 'emergency', 'maternity', 'paternity', 'unpaid'];
  if (!validTypes.includes(leaveType.toLowerCase())) {
    return { valid: false, error: `Leave type must be one of: ${validTypes.join(', ')}` };
  }

  return { valid: true, value: leaveType.toLowerCase() };
}

/**
 * Validate date range (start and end dates)
 */
export function validateDateRange(startDate, endDate) {
  const startValidation = validateDate(startDate);
  if (!startValidation.valid) {
    return { valid: false, error: `Start date: ${startValidation.error}` };
  }

  const endValidation = validateDate(endDate);
  if (!endValidation.valid) {
    return { valid: false, error: `End date: ${endValidation.error}` };
  }

  if (startValidation.value > endValidation.value) {
    return { valid: false, error: 'Start date must be before or equal to end date' };
  }

  // Check if date range is not too far in the future (max 1 year)
  const maxFutureDate = new Date();
  maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
  
  if (endValidation.value > maxFutureDate) {
    return { valid: false, error: 'Leave dates cannot be more than 1 year in the future' };
  }

  return { valid: true, value: { startDate: startValidation.value, endDate: endValidation.value } };
}

/**
 * Validate leave reason
 */
export function validateLeaveReason(reason, required = false) {
  if (!reason || typeof reason !== 'string') {
    if (required) {
      return { valid: false, error: 'Leave reason is required' };
    }
    return { valid: true, value: '' };
  }

  const trimmed = reason.trim();
  
  if (trimmed.length < 3) {
    return { valid: false, error: 'Leave reason must be at least 3 characters' };
  }

  if (trimmed.length > 500) {
    return { valid: false, error: 'Leave reason cannot exceed 500 characters' };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate concurrent leave settings
 */
export function validateConcurrentLeaveSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return { valid: false, error: 'Concurrent leave settings are required' };
  }

  if (settings.enabled) {
    if (typeof settings.maxPerTeam !== 'number' || settings.maxPerTeam < 1 || settings.maxPerTeam > 100) {
      return { valid: false, error: 'Max per team must be between 1 and 100' };
    }

    if (typeof settings.maxPerShift !== 'number' || settings.maxPerShift < 1 || settings.maxPerShift > 50) {
      return { valid: false, error: 'Max per shift must be between 1 and 50' };
    }

    if (typeof settings.checkByShift !== 'boolean') {
      return { valid: false, error: 'Check by shift must be a boolean value' };
    }
  }

  return { valid: true, value: settings };
}

/**
 * Validate annual leave days
 */
export function validateAnnualLeaveDays(days) {
  if (typeof days !== 'number') {
    return { valid: false, error: 'Annual leave days must be a number' };
  }

  if (days < 1 || days > 365) {
    return { valid: false, error: 'Annual leave days must be between 1 and 365' };
  }

  return { valid: true, value: days };
}

/**
 * Validate shift pattern type
 */
export function validateShiftPatternType(type) {
  if (!type || typeof type !== 'string') {
    return { valid: false, error: 'Shift pattern type is required' };
  }

  const validTypes = ['regular', '2-2', '3-3', '4-4', '5-5', 'custom'];
  if (!validTypes.includes(type)) {
    return { valid: false, error: `Shift pattern type must be one of: ${validTypes.join(', ')}` };
  }

  return { valid: true, value: type };
}

/**
 * Validate shift time type
 */
export function validateShiftTimeType(type) {
  if (!type || typeof type !== 'string') {
    return { valid: false, error: 'Shift time type is required' };
  }

  const validTypes = ['day', 'night', 'custom'];
  if (!validTypes.includes(type)) {
    return { valid: false, error: `Shift time type must be one of: ${validTypes.join(', ')}` };
  }

  return { valid: true, value: type };
}

/**
 * Validate time format (HH:MM)
 */
export function validateTimeFormat(time) {
  if (!time || typeof time !== 'string') {
    return { valid: false, error: 'Time is required' };
  }

  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    return { valid: false, error: 'Time must be in HH:MM format (24-hour)' };
  }

  return { valid: true, value: time };
}

/**
 * Sanitize string input (remove HTML, limit length)
 */
export function sanitizeString(input, maxLength = 500) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove HTML characters
    .substring(0, maxLength);
}

/**
 * Validate multiple fields at once
 */
export function validateFields(fields) {
  const results = {};
  const errors = [];

  for (const [fieldName, { value, validator, required = true }] of Object.entries(fields)) {
    if (!required && (value === undefined || value === null || value === '')) {
      results[fieldName] = { valid: true, value: null };
      continue;
    }

    const result = validator(value);
    results[fieldName] = result;

    if (!result.valid) {
      errors.push(`${fieldName}: ${result.error}`);
    }
  }

  return {
    valid: errors.length === 0,
    results,
    errors
  };
}

/**
 * Get all valid leave types
 */
export function getValidLeaveTypes() {
  return ['annual', 'sick', 'personal', 'emergency', 'maternity', 'paternity', 'unpaid'];
}

/**
 * Get all valid user roles
 */
export function getValidUserRoles() {
  return ['admin', 'leader', 'user'];
}

/**
 * Get all valid shift pattern types
 */
export function getValidShiftPatternTypes() {
  return ['regular', '2-2', '3-3', '4-4', '5-5', 'custom'];
}

/**
 * Get all valid shift time types
 */
export function getValidShiftTimeTypes() {
  return ['day', 'night', 'custom'];
}
