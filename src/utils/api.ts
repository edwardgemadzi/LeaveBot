/**
 * API Client Utilities
 * Centralized API calls with error handling
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Base API fetch with error handling
 */
type SuccessResponse<T> = { success: true } & T
type ErrorResponse = { success: false; error: string }
export type ApiResult<T> = SuccessResponse<T> | ErrorResponse

async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (options.headers) {
    Object.assign(headers, options.headers)
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(
        data.error || data.message || 'API request failed',
        response.status,
        data
      )
    }

    return data as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(
      'Network error. Please check your connection.',
      0
    )
  }
}

/**
 * API Client Methods
 */
export const api = {
  // Auth endpoints
  auth: {
    login: (username: string, password: string) =>
      apiFetch<ApiResult<{ token: string; user: import('../types').User }>>('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),

    register: (username: string, password: string, name: string, teamId?: string) =>
      apiFetch<ApiResult<{ token: string; user: import('../types').User }>>('/api/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, name, teamId }),
      }),
  },

  // User endpoints
  users: {
    getAll: (token: string) =>
      apiFetch<ApiResult<{ users: import('../types').User[] }>>('/api/users', { method: 'GET' }, token),

    getById: (userId: string, token: string) =>
      apiFetch<ApiResult<{ user: import('../types').User }>>(`/api/users?id=${userId}`, { method: 'GET' }, token),

    getSettings: (userId: string, token: string) =>
      apiFetch<ApiResult<{ settings: import('../types').UserSettings }>>(`/api/users?id=${userId}&action=settings`, { method: 'GET' }, token),

    update: (userId: string, data: Partial<import('../types').User>, token: string) =>
      apiFetch<ApiResult<{ user: import('../types').User }>>(`/api/users?id=${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }, token),

    updateSettings: (userId: string, settings: import('../types').UserSettings, token: string) =>
      apiFetch<ApiResult<{ settings: import('../types').UserSettings }>>(`/api/users?id=${userId}&action=settings`, {
        method: 'PUT',
        body: JSON.stringify(settings),
      }, token),

    delete: (userId: string, token: string) =>
      apiFetch<ApiResult<{}>>(`/api/users?id=${userId}`, { method: 'DELETE' }, token),

    changePassword: (userId: string, password: string, token: string) =>
      apiFetch<ApiResult<{}>>(`/api/users?id=${userId}&action=password`, {
        method: 'PUT',
        body: JSON.stringify({ password }),
      }, token),
  },

  // Leave endpoints
  leaves: {
    getAll: (token: string) =>
      apiFetch<ApiResult<{ leaves: import('../types').Leave[] }>>('/api/leaves', { method: 'GET' }, token),

    create: (leaveData: Pick<import('../types').Leave, 'employeeName' | 'startDate' | 'endDate' | 'leaveType' | 'reason' | 'userId'>, token: string) =>
      apiFetch<ApiResult<{ leave: import('../types').Leave }>>('/api/leaves', {
        method: 'POST',
        body: JSON.stringify(leaveData),
      }, token),

    updateStatus: (leaveId: string, status: 'approved' | 'rejected', token: string) =>
      apiFetch<ApiResult<{}>>(`/api/leaves/${leaveId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }, token),

    delete: (leaveId: string, token: string) =>
      apiFetch<ApiResult<{}>>(`/api/leaves/${leaveId}`, { method: 'DELETE' }, token),

    // Calculate working/calendar days for a date range
    calculate: (
      params: { startDate: string; endDate: string; userId: string },
      token: string
    ) =>
      apiFetch<ApiResult<import('../types').WorkingDaysResult>>('/api/leaves?action=calculate', {
        method: 'POST',
        body: JSON.stringify(params),
      }, token),
  },

  // Team endpoints
  teams: {
    getAll: (token: string) =>
      apiFetch<ApiResult<{ teams: import('../types').Team[] }>>('/api/teams', { method: 'GET' }, token),

    getById: (teamId: string, token: string) =>
      apiFetch<ApiResult<{ team: import('../types').Team }>>(`/api/teams?id=${teamId}`, { method: 'GET' }, token),

    getSettings: (teamId: string, token: string) =>
      apiFetch<ApiResult<{ settings: import('../types').TeamSettings }>>(`/api/teams?id=${teamId}&action=settings`, { method: 'GET' }, token),

    getMembers: async (teamId: string, token: string) => {
      // Backend returns members as part of team object
      const data = await apiFetch<ApiResult<{ team: import('../types').Team & { members?: string[] } }>>(`/api/teams?id=${teamId}`, { method: 'GET' }, token)
      if (data.success) {
        return { members: data.team?.members || [], team: data.team }
      }
      return { members: [], team: undefined as unknown as import('../types').Team }
    },

    create: (teamData: Pick<import('../types').Team, 'name' | 'description' | 'leaderId'>, token: string) =>
      apiFetch<ApiResult<{ team: import('../types').Team }>>('/api/teams', {
        method: 'POST',
        body: JSON.stringify(teamData),
      }, token),

    update: (teamId: string, teamData: Partial<import('../types').Team>, token: string) =>
      apiFetch<ApiResult<{ team: import('../types').Team }>>(`/api/teams?id=${teamId}`, {
        method: 'PUT',
        body: JSON.stringify(teamData),
      }, token),

    updateSettings: (teamId: string, settings: import('../types').TeamSettings, token: string) =>
      apiFetch<ApiResult<{ settings: import('../types').TeamSettings }>>(`/api/teams?id=${teamId}&action=settings`, {
        method: 'PUT',
        body: JSON.stringify(settings),
      }, token),

    delete: (teamId: string, token: string) =>
      apiFetch<ApiResult<{}>>(`/api/teams?id=${teamId}`, { method: 'DELETE' }, token),

    addMember: (teamId: string, userId: string, token: string) =>
      apiFetch<ApiResult<{}>>(`/api/teams?id=${teamId}&action=assign`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }, token),

    removeMember: (teamId: string, userId: string, token: string) =>
      apiFetch<ApiResult<{}>>(`/api/teams?id=${teamId}&action=remove`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }, token),
  },

  // Balance endpoints
  balance: {
    get: (userId: string, token: string, year?: number) => {
      const y = year ?? new Date().getFullYear()
      return apiFetch<ApiResult<{ balance: { totalDays: number; usedDays: number; pendingDays: number; availableDays: number } }>>(`/api/balance?userId=${userId}&year=${y}`, { method: 'GET' }, token)
    },
  },
}
