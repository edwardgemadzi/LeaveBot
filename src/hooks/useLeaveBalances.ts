/**
 * Custom hook for loading user leave balances
 */

import { useState } from 'react'
import { User } from '../types'
import { api } from '../utils/api'

export function useLeaveBalances(token: string, currentUser: User) {
  const [loading, setLoading] = useState(false)

  const loadLeaveBalances = async (users: User[]): Promise<User[]> => {
    setLoading(true)

    try {
      // Fetch team settings to get annual leave days
      let annualLeaveDays = 21 // Default

      if (currentUser.role === 'leader') {
        // Get leader's team settings
        try {
          const teamsData = await api.teams.getAll(token)
          const leaderTeam = Array.isArray(teamsData)
            ? teamsData[0]
            : teamsData.teams?.[0]

          if (leaderTeam?._id) {
            const settingsData = await api.teams.getSettings(leaderTeam._id, token)
            if (settingsData.success && settingsData.settings?.annualLeaveDays) {
              annualLeaveDays = settingsData.settings.annualLeaveDays
            }
          }
        } catch (err) {
          console.error('Failed to load team settings:', err)
        }
      } else if (currentUser.role === 'admin') {
        // Admin: try to get global/default settings
        // For now, use default
        annualLeaveDays = 21
      }

      // Fetch balances for each user
      const usersWithBalances = await Promise.all(
        users.map(async (user) => {
          try {
            const balanceData = await api.balance.get(user.id || user._id!, token)
            return {
              ...user,
              leaveBalance: {
                total: balanceData.total || annualLeaveDays,
                used: balanceData.used || 0,
                remaining: balanceData.remaining || annualLeaveDays,
              },
            }
          } catch (err) {
            console.error(`Failed to load balance for user ${user.id}:`, err)
            // Return user with default balance
            return {
              ...user,
              leaveBalance: {
                total: annualLeaveDays,
                used: 0,
                remaining: annualLeaveDays,
              },
            }
          }
        })
      )

      return usersWithBalances
    } catch (err) {
      console.error('Failed to load leave balances:', err)
      return users
    } finally {
      setLoading(false)
    }
  }

  return { loadLeaveBalances, loading }
}
