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
