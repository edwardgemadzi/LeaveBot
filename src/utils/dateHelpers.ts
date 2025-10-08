// Date formatting and calculation helpers
import { format } from 'date-fns'

/**
 * Calculate calendar days between two dates
 */
export function calculateCalendarDays(start: string | Date, end: string | Date): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

/**
 * Format date for display
 */
export function formatDisplayDate(date: string | Date): string {
  return format(new Date(date), 'MMM dd, yyyy')
}

/**
 * Format date range for display
 */
export function formatDateRange(start: string | Date, end: string | Date): string {
  return `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date): boolean {
  const today = new Date()
  const compareDate = new Date(date)
  
  return today.getFullYear() === compareDate.getFullYear() &&
         today.getMonth() === compareDate.getMonth() &&
         today.getDate() === compareDate.getDate()
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: string | Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const compareDate = new Date(date)
  
  return compareDate >= today
}

/**
 * Check if a date is in the current month
 */
export function isCurrentMonth(date: string | Date): boolean {
  const now = new Date()
  const compareDate = new Date(date)
  
  return compareDate.getMonth() === now.getMonth() && 
         compareDate.getFullYear() === now.getFullYear()
}

/**
 * Get current year
 */
export function getCurrentYear(): number {
  return new Date().getFullYear()
}

/**
 * Format date for API (YYYY-MM-DD)
 */
export function formatApiDate(date: Date): string {
  return date.toISOString().split('T')[0]
}
