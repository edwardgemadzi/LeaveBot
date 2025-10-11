import { ApiResponse, LoginRequest, RegisterRequest, AuthResponse, User, Team, Leave, LeaveRequestForm, UserForm, TeamForm } from '../types';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Base API fetch with error handling
async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || data.message || 'API request failed',
        response.status,
        data
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'Network error. Please check your connection.',
      0
    );
  }
}

// API Client
export const api = {
  // Auth endpoints
  auth: {
    login: (credentials: LoginRequest) =>
      apiFetch<ApiResponse<AuthResponse>>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    register: (userData: RegisterRequest) =>
      apiFetch<ApiResponse<AuthResponse>>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
  },

  // User endpoints
  users: {
    getAll: (token: string) =>
      apiFetch<ApiResponse<{ users: User[] }>>('/api/users', { method: 'GET' }, token),

    create: (userData: UserForm, token: string) =>
      apiFetch<ApiResponse<{ user: User }>>('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      }, token),

    update: (userId: string, userData: Partial<UserForm>, token: string) =>
      apiFetch<ApiResponse<{ user: User }>>(`/api/users?id=${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      }, token),

    delete: (userId: string, token: string) =>
      apiFetch<ApiResponse<{}>>(`/api/users?id=${userId}`, { method: 'DELETE' }, token),

    changePassword: (userId: string, password: string, token: string) =>
      apiFetch<ApiResponse<{}>>(`/api/users?id=${userId}&action=password`, {
        method: 'PUT',
        body: JSON.stringify({ password }),
      }, token),
  },

  // Team endpoints
  teams: {
    getAll: (token: string) =>
      apiFetch<ApiResponse<{ teams: Team[] }>>('/api/teams', { method: 'GET' }, token),

    create: (teamData: TeamForm, token: string) =>
      apiFetch<ApiResponse<{ team: Team }>>('/api/teams', {
        method: 'POST',
        body: JSON.stringify(teamData),
      }, token),

    update: (teamId: string, teamData: Partial<TeamForm>, token: string) =>
      apiFetch<ApiResponse<{ team: Team }>>(`/api/teams?id=${teamId}`, {
        method: 'PUT',
        body: JSON.stringify(teamData),
      }, token),

    delete: (teamId: string, token: string) =>
      apiFetch<ApiResponse<{}>>(`/api/teams?id=${teamId}`, { method: 'DELETE' }, token),

    generateToken: (teamId: string, token: string) =>
      apiFetch<ApiResponse<{ teamToken: string; teamName: string; expiresIn: string }>>(
        `/api/teams?id=${teamId}&action=token`, 
        { method: 'GET' }, 
        token
      ),
  },

  // Leave endpoints
  leaves: {
    getAll: (token: string) =>
      apiFetch<ApiResponse<{ leaves: Leave[] }>>('/api/leaves', { method: 'GET' }, token),

    create: (leaveData: LeaveRequestForm, token: string) =>
      apiFetch<ApiResponse<{ leave: Leave }>>('/api/leaves', {
        method: 'POST',
        body: JSON.stringify(leaveData),
      }, token),

    update: (leaveId: string, status: 'pending' | 'approved' | 'rejected', token: string) =>
      apiFetch<ApiResponse<{ leave: Leave }>>(`/api/leaves?id=${leaveId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }, token),

    delete: (leaveId: string, token: string) =>
      apiFetch<ApiResponse<{}>>(`/api/leaves?id=${leaveId}`, { method: 'DELETE' }, token),
  },
};

export { ApiError };
