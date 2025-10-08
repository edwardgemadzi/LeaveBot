/**
 * API Client Utilities
 * Centralized API calls with error handling
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Base API fetch with error handling
 */
async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<any> {
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

    return data
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
      apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),

    register: (username: string, password: string, name: string, teamId?: string) =>
      apiFetch('/api/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, name, teamId }),
      }),
  },

  // User endpoints
  users: {
    getAll: (token: string) =>
      apiFetch('/api/users', { method: 'GET' }, token),

    getById: (userId: string, token: string) =>
      apiFetch(`/api/users?id=${userId}`, { method: 'GET' }, token),

    getSettings: (userId: string, token: string) =>
      apiFetch(`/api/users?id=${userId}&action=settings`, { method: 'GET' }, token),

    update: (userId: string, data: any, token: string) =>
      apiFetch(`/api/users?id=${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }, token),

    updateSettings: (userId: string, settings: any, token: string) =>
      apiFetch(`/api/users?id=${userId}&action=settings`, {
        method: 'PUT',
        body: JSON.stringify(settings),
      }, token),

    delete: (userId: string, token: string) =>
      apiFetch(`/api/users?id=${userId}`, { method: 'DELETE' }, token),

    changePassword: (userId: string, password: string, token: string) =>
      apiFetch(`/api/users?id=${userId}&action=password`, {
        method: 'PUT',
        body: JSON.stringify({ password }),
      }, token),
  },

  // Leave endpoints
  leaves: {
    getAll: (token: string) =>
      apiFetch('/api/leaves', { method: 'GET' }, token),

    create: (leaveData: any, token: string) =>
      apiFetch('/api/leaves', {
        method: 'POST',
        body: JSON.stringify(leaveData),
      }, token),

    updateStatus: (leaveId: string, status: string, token: string) =>
      apiFetch(`/api/leaves/${leaveId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }, token),

    delete: (leaveId: string, token: string) =>
      apiFetch(`/api/leaves/${leaveId}`, { method: 'DELETE' }, token),
  },

  // Team endpoints
  teams: {
    getAll: (token: string) =>
      apiFetch('/api/teams', { method: 'GET' }, token),

    getById: (teamId: string, token: string) =>
      apiFetch(`/api/teams?id=${teamId}`, { method: 'GET' }, token),

    getSettings: (teamId: string, token: string) =>
      apiFetch(`/api/teams?id=${teamId}&action=settings`, { method: 'GET' }, token),

    getMembers: async (teamId: string, token: string) => {
      // Backend returns members as part of team object
      const data = await apiFetch(`/api/teams?id=${teamId}`, { method: 'GET' }, token)
      return { members: data.team?.members || [], team: data.team }
    },

    create: (teamData: any, token: string) =>
      apiFetch('/api/teams', {
        method: 'POST',
        body: JSON.stringify(teamData),
      }, token),

    update: (teamId: string, teamData: any, token: string) =>
      apiFetch(`/api/teams?id=${teamId}`, {
        method: 'PUT',
        body: JSON.stringify(teamData),
      }, token),

    updateSettings: (teamId: string, settings: any, token: string) =>
      apiFetch(`/api/teams?id=${teamId}&action=settings`, {
        method: 'PUT',
        body: JSON.stringify(settings),
      }, token),

    delete: (teamId: string, token: string) =>
      apiFetch(`/api/teams?id=${teamId}`, { method: 'DELETE' }, token),

    addMember: (teamId: string, userId: string, token: string) =>
      apiFetch(`/api/teams?id=${teamId}&action=assign`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }, token),

    removeMember: (teamId: string, userId: string, token: string) =>
      apiFetch(`/api/teams?id=${teamId}&action=remove`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }, token),
  },

  // Balance endpoints
  balance: {
    get: (userId: string, token: string) =>
      apiFetch(`/api/balance?userId=${userId}`, { method: 'GET' }, token),
  },
}
