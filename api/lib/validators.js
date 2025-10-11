import { ObjectId } from 'mongodb';

// Validate ObjectId
export function validateObjectId(id) {
  if (!id) {
    return { valid: false, error: 'ID is required' };
  }
  
  if (!ObjectId.isValid(id)) {
    return { valid: false, error: 'Invalid ID format' };
  }
  
  return { valid: true, value: new ObjectId(id) };
}

// Validate username
export function validateUsername(username) {
  if (!username) {
    return { valid: false, error: 'Username is required' };
  }
  
  if (typeof username !== 'string') {
    return { valid: false, error: 'Username must be a string' };
  }
  
  const trimmed = username.trim();
  
  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long' };
  }
  
  if (trimmed.length > 50) {
    return { valid: false, error: 'Username must be less than 50 characters' };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  return { valid: true, value: trimmed };
}

// Validate password
export function validatePassword(password) {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  
  if (typeof password !== 'string') {
    return { valid: false, error: 'Password must be a string' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password must be less than 128 characters' };
  }
  
  return { valid: true, value: password };
}

// Validate name
export function validateName(name) {
  if (!name) {
    return { valid: false, error: 'Name is required' };
  }
  
  if (typeof name !== 'string') {
    return { valid: false, error: 'Name must be a string' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long' };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, error: 'Name must be less than 100 characters' };
  }
  
  return { valid: true, value: trimmed };
}

// Validate email
export function validateEmail(email) {
  if (!email) {
    return { valid: true, value: null }; // Email is optional
  }
  
  if (typeof email !== 'string') {
    return { valid: false, error: 'Email must be a string' };
  }
  
  const trimmed = email.trim().toLowerCase();
  
  if (trimmed.length === 0) {
    return { valid: true, value: null };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true, value: trimmed };
}

// Validate role
export function validateRole(role) {
  const validRoles = ['admin', 'leader', 'user'];
  
  if (!role) {
    return { valid: false, error: 'Role is required' };
  }
  
  if (!validRoles.includes(role)) {
    return { valid: false, error: 'Invalid role. Must be admin, leader, or user' };
  }
  
  return { valid: true, value: role };
}

// Validate team name
export function validateTeamName(name) {
  if (!name) {
    return { valid: false, error: 'Team name is required' };
  }
  
  if (typeof name !== 'string') {
    return { valid: false, error: 'Team name must be a string' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < 2) {
    return { valid: false, error: 'Team name must be at least 2 characters long' };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, error: 'Team name must be less than 100 characters' };
  }
  
  return { valid: true, value: trimmed };
}

// Validate leave type
export function validateLeaveType(type) {
  const validTypes = ['annual', 'sick', 'personal', 'other'];
  
  if (!type) {
    return { valid: false, error: 'Leave type is required' };
  }
  
  if (!validTypes.includes(type)) {
    return { valid: false, error: 'Invalid leave type' };
  }
  
  return { valid: true, value: type };
}

// Validate leave status
export function validateLeaveStatus(status) {
  const validStatuses = ['pending', 'approved', 'rejected'];
  
  if (!status) {
    return { valid: false, error: 'Leave status is required' };
  }
  
  if (!validStatuses.includes(status)) {
    return { valid: false, error: 'Invalid leave status' };
  }
  
  return { valid: true, value: status };
}

// Validate date
export function validateDate(date) {
  if (!date) {
    return { valid: false, error: 'Date is required' };
  }
  
  const parsedDate = new Date(date);
  
  if (isNaN(parsedDate.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  
  return { valid: true, value: parsedDate };
}

// Validate date range
export function validateDateRange(startDate, endDate) {
  const startValidation = validateDate(startDate);
  if (!startValidation.valid) {
    return startValidation;
  }
  
  const endValidation = validateDate(endDate);
  if (!endValidation.valid) {
    return endValidation;
  }
  
  if (endValidation.value < startValidation.value) {
    return { valid: false, error: 'End date must be after start date' };
  }
  
  // Check if dates are not too far in the past or future
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  
  if (startValidation.value < oneYearAgo) {
    return { valid: false, error: 'Start date cannot be more than one year in the past' };
  }
  
  if (endValidation.value > oneYearFromNow) {
    return { valid: false, error: 'End date cannot be more than one year in the future' };
  }
  
  return { 
    valid: true, 
    value: { 
      startDate: startValidation.value, 
      endDate: endValidation.value 
    } 
  };
}

// Sanitize string input
export function sanitizeString(str) {
  if (typeof str !== 'string') {
    return '';
  }
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

// Validate working days
export function validateWorkingDays(workingDays) {
  if (!workingDays || typeof workingDays !== 'object') {
    return { valid: false, error: 'Working days must be an object' };
  }
  
  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  let hasAtLeastOneDay = false;
  
  for (const day of validDays) {
    if (workingDays.hasOwnProperty(day)) {
      if (typeof workingDays[day] !== 'boolean') {
        return { valid: false, error: `Working day '${day}' must be a boolean` };
      }
      if (workingDays[day]) {
        hasAtLeastOneDay = true;
      }
    }
  }
  
  if (!hasAtLeastOneDay) {
    return { valid: false, error: 'At least one working day must be selected' };
  }
  
  return { valid: true, value: workingDays };
}
