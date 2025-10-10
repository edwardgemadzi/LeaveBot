/**
 * Utility functions for team management
 */

import { Team, User } from '../types'

/**
 * Check if user can manage teams
 */
export function canManageTeams(user: User): boolean {
  return user.role === 'admin' || user.role === 'leader'
}

/**
 * Check if user can edit specific team
 */
export function canEditTeam(user: User, team: Team): boolean {
  if (user.role === 'admin') return true
  if (user.role === 'leader') {
    // Handle both ObjectId and string comparison
    const userTeamId = user.teamId?.toString()
    const teamId = team.id?.toString() || team._id?.toString()
    const teamLeaderId = team.leaderId?.toString()
    
    // Leader can edit if they are the leader of this team OR if this is their team
    return teamLeaderId === user.id?.toString() || userTeamId === teamId
  }
  return false
}

/**
 * Filter users that can be leaders
 */
export function getAvailableLeaders(users: User[]): User[] {
  return users.filter((u) => u.role === 'leader')
}

/**
 * Filter users that are not in any team (available for assignment)
 */
export function getUnassignedUsers(users: User[], teams: Team[]): User[] {
  const assignedUserIds = new Set<string>()
  
  teams.forEach((team) => {
    team.members?.forEach((memberId) => {
      assignedUserIds.add(memberId)
    })
  })

  return users.filter((user) => !assignedUserIds.has(user.id || user._id!))
}

/**
 * Get team member count
 */
export function getTeamMemberCount(team: Team): number {
  return team.memberCount || team.members?.length || 0
}

/**
 * Format team creation date
 */
export function formatTeamDate(date: string): string {
  return new Date(date).toLocaleDateString()
}
