/**
 * Backend/Frontend API Consistency Documentation
 * 
 * This file documents the API endpoints and ensures consistency between
 * frontend API calls and backend implementation.
 */

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

/**
 * POST /api/login
 * Frontend: api.auth.login(username, password)
 * Backend: api/login.js
 * Request: { username: string, password: string }
 * Response: { success: boolean, token: string, user: User }
 * ✅ Consistent
 */

/**
 * POST /api/register
 * Frontend: api.auth.register(username, password, name, teamId?)
 * Backend: api/register.js
 * Request: { username: string, password: string, name: string, teamId?: string }
 * Response: { success: boolean, token: string, user: User }
 * ✅ Consistent
 */

// ============================================================================
// USER ENDPOINTS
// ============================================================================

/**
 * GET /api/users
 * Frontend: api.users.getAll(token)
 * Backend: api/users.js - handleListUsers()
 * Request: Headers { Authorization: Bearer <token> }
 * Response: { success: boolean, users: User[] }
 * ✅ Consistent
 */

/**
 * GET /api/users?id={userId}
 * Frontend: api.users.getById(userId, token)
 * Backend: api/users.js
 * Request: Headers { Authorization: Bearer <token> }
 * Response: { success: boolean, user: User }
 * ✅ Consistent
 */

/**
 * GET /api/users?id={userId}&action=settings
 * Frontend: api.users.getSettings(userId, token)
 * Backend: api/users.js - handleGetUserSettings()
 * Request: Headers { Authorization: Bearer <token> }
 * Response: { success: boolean, settings: UserSettings }
 * ✅ Consistent
 */

/**
 * PUT /api/users?id={userId}
 * Frontend: api.users.update(userId, data, token)
 * Backend: api/users.js - handleUpdateUser()
 * Request: { name?: string, role?: string, teamId?: string }
 * Response: { success: boolean, user: User }
 * ✅ Consistent
 */

/**
 * PUT /api/users?id={userId}&action=settings
 * Frontend: api.users.updateSettings(userId, settings, token)
 * Backend: api/users.js - handleUpdateUserSettings()
 * Request: { shiftPattern: ShiftPattern, shiftTime: ShiftTime }
 * Response: { success: boolean, settings: UserSettings }
 * ✅ Consistent
 */

/**
 * PUT /api/users?id={userId}&action=password
 * Frontend: api.users.changePassword(userId, password, token)
 * Backend: api/users.js - handlePasswordChange()
 * Request: { password: string }
 * Response: { success: boolean, message: string }
 * ✅ Consistent
 */

/**
 * DELETE /api/users?id={userId}
 * Frontend: api.users.delete(userId, token)
 * Backend: api/users.js - handleDeleteUser()
 * Request: Headers { Authorization: Bearer <token> }
 * Response: { success: boolean, message: string }
 * ✅ Consistent
 */

// ============================================================================
// LEAVE ENDPOINTS
// ============================================================================

/**
 * GET /api/leaves
 * Frontend: api.leaves.getAll(token)
 * Backend: api/leaves.js
 * Request: Headers { Authorization: Bearer <token> }
 * Response: { success: boolean, leaves: Leave[] }
 * ✅ Consistent
 */

/**
 * POST /api/leaves
 * Frontend: api.leaves.create(leaveData, token)
 * Backend: api/leaves.js
 * Request: { 
 *   employeeName: string, 
 *   startDate: string, 
 *   endDate: string,
 *   reason: string,
 *   leaveType?: string
 * }
 * Response: { success: boolean, leave: Leave }
 * ✅ Consistent
 */

/**
 * PUT /api/leaves/{leaveId}
 * Frontend: api.leaves.updateStatus(leaveId, status, token)
 * Backend: api/leaves/[id].js
 * Request: { status: 'approved' | 'rejected' }
 * Response: { success: boolean, leave: Leave }
 * ✅ Consistent
 */

/**
 * DELETE /api/leaves/{leaveId}
 * Frontend: api.leaves.delete(leaveId, token)
 * Backend: api/leaves/[id].js
 * Request: Headers { Authorization: Bearer <token> }
 * Response: { success: boolean, message: string }
 * ✅ Consistent
 */

// ============================================================================
// TEAM ENDPOINTS
// ============================================================================

/**
 * GET /api/teams
 * Frontend: api.teams.getAll(token)
 * Backend: api/teams.js - handleListTeams()
 * Request: Headers { Authorization: Bearer <token> }
 * Response: { teams: Team[] }
 * ✅ Consistent
 */

/**
 * GET /api/teams?id={teamId}
 * Frontend: api.teams.getById(teamId, token)
 * Backend: api/teams.js - handleGetTeamDetails()
 * Request: Headers { Authorization: Bearer <token> }
 * Response: { team: Team }
 * ✅ Consistent
 */

/**
 * GET /api/teams?id={teamId}&action=settings
 * Frontend: api.teams.getSettings(teamId, token)
 * Backend: api/teams.js - handleGetTeamSettings()
 * Request: Headers { Authorization: Bearer <token> }
 * Response: { success: boolean, settings: TeamSettings }
 * ✅ Consistent
 */

/**
 * GET /api/teams?id={teamId}&action=members
 * Frontend: api.teams.getMembers(teamId, token)
 * Backend: api/teams.js - handleGetTeamDetails() returns members
 * Request: Headers { Authorization: Bearer <token> }
 * Response: { team: Team, members: User[] }
 * ⚠️ Note: Backend returns members as part of team object
 */

/**
 * POST /api/teams
 * Frontend: api.teams.create(teamData, token)
 * Backend: api/teams.js - handleCreateTeam()
 * Request: { name: string, description: string, leaderId: string }
 * Response: { success: boolean, team: Team }
 * ✅ Consistent
 */

/**
 * POST /api/teams?id={teamId}&action=assign
 * Frontend: api.teams.addMember(teamId, userId, token)
 * Backend: api/teams.js - handleAssignUser()
 * Request: { userId: string }
 * Response: { success: boolean, message: string }
 * ⚠️ Note: Frontend uses 'add-member', backend uses 'assign'
 */

/**
 * POST /api/teams?id={teamId}&action=remove
 * Frontend: api.teams.removeMember(teamId, userId, token)
 * Backend: api/teams.js - handleRemoveUser()
 * Request: { userId: string }
 * Response: { success: boolean, message: string }
 * ⚠️ Note: Frontend uses 'remove-member', backend uses 'remove'
 */

/**
 * PUT /api/teams?id={teamId}
 * Frontend: api.teams.update(teamId, teamData, token)
 * Backend: api/teams.js - handleUpdateTeam()
 * Request: { name?: string, description?: string, leaderId?: string }
 * Response: { success: boolean, team: Team }
 * ✅ Consistent
 */

/**
 * PUT /api/teams?id={teamId}&action=settings
 * Frontend: api.teams.updateSettings(teamId, settings, token)
 * Backend: api/teams.js - handleUpdateTeamSettings()
 * Request: TeamSettings
 * Response: { success: boolean, settings: TeamSettings }
 * ✅ Consistent
 */

/**
 * DELETE /api/teams?id={teamId}
 * Frontend: api.teams.delete(teamId, token)
 * Backend: api/teams.js - handleDeleteTeam()
 * Request: Headers { Authorization: Bearer <token> }
 * Response: { success: boolean, message: string }
 * ✅ Consistent
 */

// ============================================================================
// BALANCE ENDPOINTS
// ============================================================================

/**
 * GET /api/balance?userId={userId}
 * Frontend: api.balance.get(userId, token)
 * Backend: api/balance.js
 * Request: Headers { Authorization: Bearer <token> }
 * Response: { total: number, used: number, remaining: number }
 * ✅ Consistent
 */

// ============================================================================
// INCONSISTENCIES TO FIX
// ============================================================================

/**
 * ISSUE 1: Team member actions
 * Frontend: addMember/removeMember use 'add-member'/'remove-member' in action param
 * Backend: Uses 'assign'/'remove' in action param
 * FIX: Update frontend to use 'assign'/'remove' to match backend
 */

/**
 * ISSUE 2: Team members endpoint
 * Frontend: api.teams.getMembers() expects separate action=members
 * Backend: Returns members as part of team object when getting team details
 * FIX: Update frontend to extract members from team object
 */

export const API_INCONSISTENCIES = {
  teamMemberActions: {
    issue: "Action parameter mismatch",
    frontend: "add-member / remove-member",
    backend: "assign / remove",
    severity: "HIGH",
    fix: "Update api.ts teamMemberActions to use 'assign' and 'remove'"
  },
  teamMembers: {
    issue: "Members retrieval method mismatch",
    frontend: "Separate action=members endpoint",
    backend: "Included in team details",
    severity: "MEDIUM",
    fix: "Update getMembers to call getById and extract members"
  }
}
