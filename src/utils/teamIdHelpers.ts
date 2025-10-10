/**
 * Utility functions for consistent team ID handling
 */

import { Team } from '../types'

/**
 * Get normalized team ID (prefer id over _id, convert to string)
 */
export function getTeamId(team: Team): string {
  return (team.id || team._id)?.toString() || ''
}

/**
 * Check if two team IDs are equal (handles ObjectId vs string comparison)
 */
export function areTeamIdsEqual(teamId1: string | undefined, teamId2: string | undefined): boolean {
  if (!teamId1 || !teamId2) return false
  return teamId1.toString() === teamId2.toString()
}

/**
 * Check if user belongs to team (handles ObjectId vs string comparison)
 */
export function isUserInTeam(userTeamId: string | undefined, team: Team): boolean {
  if (!userTeamId) return false
  return areTeamIdsEqual(userTeamId, getTeamId(team))
}

/**
 * Normalize team ID for API calls (ensure it's a string)
 */
export function normalizeTeamIdForApi(teamId: string | undefined): string {
  return teamId?.toString() || ''
}
