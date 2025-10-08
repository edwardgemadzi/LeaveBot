/**
 * Working Days Calculator
 * Handles different shift patterns: regular (Mon-Fri), 2/2, 5/2, and custom cycles
 */

/**
 * Calculate working days between two dates based on shift pattern
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date (inclusive)
 * @param {Object} shiftPattern - Shift pattern configuration
 * @param {Object} workingDaysConfig - Working days configuration
 * @returns {Object} { count, dates, calendarDays }
 */
export function calculateWorkingDays(startDate, endDate, shiftPattern, workingDaysConfig) {
  const workingDays = [];
  const allDates = [];
  let current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  while (current <= end) {
    allDates.push(new Date(current));
    
    if (isWorkingDay(current, shiftPattern, workingDaysConfig)) {
      workingDays.push(new Date(current));
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return {
    count: workingDays.length,
    dates: workingDays,
    calendarDays: allDates.length
  };
}

/**
 * Check if a specific date is a working day
 * @param {Date} date - Date to check
 * @param {Object} shiftPattern - Shift pattern configuration {type, referenceDate, customPattern}
 * @param {Object} workingDaysConfig - Working days configuration {monday, tuesday, etc.}
 * @returns {boolean} True if it's a working day
 */
export function isWorkingDay(date, shiftPattern, workingDaysConfig) {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  // For rotation patterns (2-2, 3-3, 4-4, 5-5, custom), check the cycle
  // These patterns work ANY day of the week, just rotating on/off cycles
  if (shiftPattern.type !== 'regular') {
    if (shiftPattern.referenceDate) {
      const refDate = new Date(shiftPattern.referenceDate);
      refDate.setHours(0, 0, 0, 0);
      
      const daysSinceReference = Math.floor((checkDate - refDate) / (1000 * 60 * 60 * 24));
      
      // For custom patterns, use customPattern field
      if (shiftPattern.type === 'custom' && shiftPattern.customPattern) {
        // Custom pattern format: "WWWOO" where W=work, O=off
        const pattern = shiftPattern.customPattern.toUpperCase();
        const cycleLength = pattern.length;
        const positionInCycle = ((daysSinceReference % cycleLength) + cycleLength) % cycleLength;
        const dayChar = pattern[positionInCycle];
        
        return dayChar === 'W'; // W = working day
      }
      
      // For standard rotation patterns (2-2, 3-3, etc.)
      const match = shiftPattern.type.match(/^(\d+)-(\d+)$/);
      if (match) {
        const workDays = parseInt(match[1]);
        const offDays = parseInt(match[2]);
        const cycleLength = workDays + offDays;
        
        const positionInCycle = ((daysSinceReference % cycleLength) + cycleLength) % cycleLength;
        
        // First part of cycle is working days
        return positionInCycle < workDays;
      }
    }
  }
  
  // For regular pattern, check working days configuration
  if (shiftPattern.type === 'regular' && workingDaysConfig) {
    const dayOfWeek = checkDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    return workingDaysConfig[dayName] === true;
  }
  
  // Fallback
  return true;
}

/**
 * Check if date is a regular working day (Mon-Fri by default)
 */
function isRegularWorkDay(date, workingDaysConfig) {
  const dayOfWeek = date.getDay();
  
  // If excludeWeekends is enabled (default), exclude Saturday and Sunday
  if (workingDaysConfig?.excludeWeekends) {
    return dayOfWeek > 0 && dayOfWeek < 6; // Monday (1) to Friday (5)
  }
  
  // Otherwise, all days are working days unless in customOffDays
  return true;
}

/**
 * Check if date is a working day in a cyclic pattern (2/2, 5/2, etc.)
 */
function isCyclicWorkDay(date, shiftPattern) {
  const patternStart = new Date(shiftPattern.startDate);
  patternStart.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  // Calculate days since pattern started
  const daysSinceStart = Math.floor((checkDate - patternStart) / (1000 * 60 * 60 * 24));
  
  // If before pattern start, can't determine
  if (daysSinceStart < 0) {
    return false;
  }
  
  // Calculate position in cycle
  const cycleLength = shiftPattern.workDays + shiftPattern.offDays;
  const positionInCycle = daysSinceStart % cycleLength;
  
  // Working days are at the beginning of each cycle
  return positionInCycle < shiftPattern.workDays;
}

/**
 * Get all working days in a date range as an array
 * Useful for displaying in calendar or checking conflicts
 */
export function getWorkingDatesArray(startDate, endDate, shiftPattern, workingDaysConfig) {
  const result = calculateWorkingDays(startDate, endDate, shiftPattern, workingDaysConfig);
  return result.dates;
}

/**
 * Check if two date ranges overlap
 */
export function dateRangesOverlap(start1, end1, start2, end2) {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  
  return s1 <= e2 && s2 <= e1;
}

/**
 * Get default team settings
 */
export function getDefaultTeamSettings() {
  return {
    shiftPattern: {
      type: 'regular',
      workDays: 5,
      offDays: 2,
      startDate: new Date()
    },
    shiftTime: {
      type: 'day',
      startTime: '08:00',
      endTime: '17:00'
    },
    workingDays: {
      excludeWeekends: true,
      customOffDays: [0, 6], // Sunday and Saturday
      countOnlyWorkDays: true
    },
    concurrentLeave: {
      enabled: false,
      maxPerShift: 3,
      maxPerTeam: 5,
      checkByShift: false
    },
    annualLeaveDays: 21,
    maxConsecutiveDays: 14,
    minAdvanceNoticeDays: 7,
    carryOverDays: 5,
    allowNegativeBalance: false,
    maxConcurrentLeave: 3
  };
}

/**
 * Validate shift pattern configuration
 */
export function validateShiftPattern(shiftPattern) {
  if (!shiftPattern || typeof shiftPattern !== 'object') {
    return { valid: false, error: 'Shift pattern is required' };
  }
  
  const validTypes = ['regular', '2-2', '5-2', 'custom'];
  if (!validTypes.includes(shiftPattern.type)) {
    return { valid: false, error: 'Invalid shift pattern type' };
  }
  
  if (shiftPattern.type !== 'regular') {
    if (!shiftPattern.workDays || shiftPattern.workDays < 1 || shiftPattern.workDays > 30) {
      return { valid: false, error: 'Work days must be between 1 and 30' };
    }
    
    if (!shiftPattern.offDays || shiftPattern.offDays < 1 || shiftPattern.offDays > 30) {
      return { valid: false, error: 'Off days must be between 1 and 30' };
    }
    
    if (!shiftPattern.startDate) {
      return { valid: false, error: 'Start date is required for cyclic patterns' };
    }
  }
  
  return { valid: true };
}

/**
 * Validate concurrent leave settings
 */
export function validateConcurrentLeave(concurrentLeave) {
  if (!concurrentLeave || typeof concurrentLeave !== 'object') {
    return { valid: false, error: 'Concurrent leave settings are required' };
  }
  
  if (concurrentLeave.enabled) {
    if (concurrentLeave.maxPerShift && (concurrentLeave.maxPerShift < 1 || concurrentLeave.maxPerShift > 50)) {
      return { valid: false, error: 'Max per shift must be between 1 and 50' };
    }
    
    if (concurrentLeave.maxPerTeam && (concurrentLeave.maxPerTeam < 1 || concurrentLeave.maxPerTeam > 100)) {
      return { valid: false, error: 'Max per team must be between 1 and 100' };
    }
  }
  
  return { valid: true };
}
