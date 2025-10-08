// Working days calculation utilities
import { addDays } from 'date-fns'
import type { UserSettings, Leave, DateRange } from '../types'

/**
 * Check if a date is a working day based on user's shift pattern
 */
export function isWorkingDay(date: Date, settings?: UserSettings | null): boolean {
  if (!settings) {
    return true // If no settings, allow all days
  }
  
  const { shiftPattern } = settings
  
  // For rotation patterns (2-2, 3-3, 4-4, 5-5, custom), check the cycle
  // These patterns work ANY day of the week, just rotating on/off cycles
  if (shiftPattern.type !== 'regular' && shiftPattern.referenceDate) {
    const referenceDate = new Date(shiftPattern.referenceDate)
    const daysSinceReference = Math.floor((date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // For custom patterns, use customPattern field
    if (shiftPattern.type === 'custom' && shiftPattern.customPattern) {
      // Custom pattern format: "WWWOO" where W=work, O=off
      const pattern = shiftPattern.customPattern.toUpperCase()
      const cycleLength = pattern.length
      const positionInCycle = ((daysSinceReference % cycleLength) + cycleLength) % cycleLength
      const dayChar = pattern[positionInCycle]
      
      return dayChar === 'W' // W = working day
    }
    
    // For standard rotation patterns (2-2, 3-3, etc.)
    const match = shiftPattern.type.match(/^(\d+)-(\d+)$/)
    if (match) {
      const workDays = parseInt(match[1])
      const offDays = parseInt(match[2])
      const cycleLength = workDays + offDays
      const positionInCycle = ((daysSinceReference % cycleLength) + cycleLength) % cycleLength
      
      // First part of cycle is working days
      return positionInCycle < workDays
    }
  }
  
  // For regular pattern, working days are always Mon-Fri
  if (shiftPattern.type === 'regular') {
    const dayOfWeek = date.getDay()
    // 0 = Sunday, 6 = Saturday
    return dayOfWeek >= 1 && dayOfWeek <= 5 // Monday to Friday
  }
  
  // Fallback: allow the day
  return true
}

/**
 * Split a leave into continuous working day ranges
 * This ensures leave events only show on actual working days
 */
export function splitLeaveByWorkingDays(
  leave: Leave, 
  settings?: UserSettings | null
): DateRange[] {
  const startDate = new Date(leave.startDate)
  const endDate = new Date(leave.endDate)
  
  // If no settings for this user, we can't filter by working days
  // This shouldn't happen as backend returns defaults, but just in case
  if (!settings) {
    console.warn(`No settings found for user ${leave.userId}, showing full range`)
    return [{ start: startDate, end: addDays(endDate, 1) }]
  }

  const ranges: DateRange[] = []
  let currentRangeStart: Date | null = null
  
  // Iterate through each day in the leave period
  let currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const isWorking = isWorkingDay(currentDate, settings)
    
    if (isWorking) {
      if (!currentRangeStart) {
        // Start a new range
        currentRangeStart = new Date(currentDate)
      }
    } else {
      if (currentRangeStart) {
        // End the current range (yesterday was the last working day)
        const rangeEnd = new Date(currentDate)
        ranges.push({ start: currentRangeStart, end: rangeEnd })
        currentRangeStart = null
      }
    }
    
    // Move to next day
    currentDate = addDays(currentDate, 1)
  }
  
  // If there's an open range at the end, close it
  if (currentRangeStart) {
    ranges.push({ start: currentRangeStart, end: addDays(endDate, 1) })
  }
  
  return ranges.length > 0 ? ranges : [{ start: startDate, end: addDays(endDate, 1) }]
}

/**
 * Calculate the number of working days in a date range
 */
export function calculateWorkingDaysCount(
  startDate: Date,
  endDate: Date,
  settings?: UserSettings | null
): number {
  let count = 0
  let currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    if (isWorkingDay(currentDate, settings)) {
      count++
    }
    currentDate = addDays(currentDate, 1)
  }
  
  return count
}

/**
 * Get all working days in a date range as an array of dates
 */
export function getWorkingDaysInRange(
  startDate: Date,
  endDate: Date,
  settings?: UserSettings | null
): Date[] {
  const workingDays: Date[] = []
  let currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    if (isWorkingDay(currentDate, settings)) {
      workingDays.push(new Date(currentDate))
    }
    currentDate = addDays(currentDate, 1)
  }
  
  return workingDays
}
