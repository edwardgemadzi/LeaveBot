/**
 * Utility functions for user management
 */

import { User } from '../types'

/**
 * Check if current user can manage target user
 */
export function canManageUser(currentUser: User, targetUser: User): boolean {
  // Admin can manage everyone except themselves
  if (currentUser.role === 'admin') {
    return currentUser.id !== targetUser.id
  }

  // Leaders can only manage regular users in their team
  if (currentUser.role === 'leader') {
    return targetUser.role === 'user' && targetUser.teamId === currentUser.teamId
  }

  return false
}

/**
 * Get role badge color
 */
export function getRoleColor(role: string): string {
  switch (role) {
    case 'admin':
      return 'text-purple-600 bg-purple-50'
    case 'leader':
      return 'text-blue-600 bg-blue-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

/**
 * Get role icon
 */
export function getRoleIcon(role: string): string {
  switch (role) {
    case 'admin':
      return '👑'
    case 'leader':
      return '⭐'
    default:
      return '👤'
  }
}

/**
 * Format leave balance display
 */
export function formatLeaveBalance(balance?: {
  total: number
  used: number
  remaining: number
}) {
  if (!balance) return { display: 'N/A', color: 'text-gray-500' }

  const { remaining, total } = balance
  const percentage = (remaining / total) * 100

  let color = 'text-green-600'
  if (percentage < 20) color = 'text-red-600'
  else if (percentage < 50) color = 'text-amber-600'

  return {
    display: `${remaining}/${total} days`,
    color,
    percentage,
  }
}
