/**
 * Hook for Dashboard statistics calculations
 */

import { useMemo } from 'react'
import { Leave, User } from '../types'

interface DashboardStats {
  total: number
  pending: number
  approved: number
  rejected: number
  thisMonth: number
  workingDaysUsed: number
}

export function useDashboardStats(leaves: Leave[], user: User) {
  // Helper to calculate working days (falls back to calendar days if not available)
  const calculateDaysForLeave = (leave: Leave) => {
    if (leave.workingDaysCount) return leave.workingDaysCount
    // Fallback: calculate calendar days
    const start = new Date(leave.startDate)
    const end = new Date(leave.endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  const stats: DashboardStats = useMemo(() => {
    if (user.role === 'admin' || user.role === 'leader') {
      // Admin/Leader sees all team leaves statistics (backend filters by team for leaders)
      const approvedLeaves = leaves.filter(l => l.status === 'approved')
      const workingDaysUsed = approvedLeaves.reduce((sum, leave) => sum + calculateDaysForLeave(leave), 0)
      
      return {
        total: leaves.length,
        pending: leaves.filter(l => l.status === 'pending').length,
        approved: approvedLeaves.length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
        thisMonth: leaves.filter(l => {
          const date = new Date(l.createdAt)
          const now = new Date()
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
        }).length,
        workingDaysUsed,
      }
    } else {
      // User sees only their leaves
      const myLeaves = leaves.filter(l => l.userId === user.id)
      const approvedLeaves = myLeaves.filter(l => l.status === 'approved')
      const workingDaysUsed = approvedLeaves.reduce((sum, leave) => sum + calculateDaysForLeave(leave), 0)
      
      return {
        total: myLeaves.length,
        pending: myLeaves.filter(l => l.status === 'pending').length,
        approved: approvedLeaves.length,
        rejected: myLeaves.filter(l => l.status === 'rejected').length,
        thisMonth: myLeaves.filter(l => {
          const date = new Date(l.createdAt)
          const now = new Date()
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
        }).length,
        workingDaysUsed,
      }
    }
  }, [leaves, user])

  const upcomingLeaves = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let filteredLeaves = leaves
    // Regular users only see their own upcoming leaves
    // Admin and Leader see all team upcoming leaves (backend filters by team for leaders)
    if (user.role !== 'admin' && user.role !== 'leader') {
      filteredLeaves = leaves.filter(l => l.userId === user.id)
    }
    
    return filteredLeaves
      .filter(l => {
        const startDate = new Date(l.startDate)
        return startDate >= today && l.status === 'approved'
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 5)
  }, [leaves, user])

  const recentActivity = useMemo(() => {
    let filteredLeaves = leaves
    if (user.role !== 'admin' && user.role !== 'leader') {
      filteredLeaves = leaves.filter(l => l.userId === user.id)
    }
    
    return [...filteredLeaves]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [leaves, user])

  return {
    stats,
    upcomingLeaves,
    recentActivity,
  }
}
