// User types
export interface User {
  _id: string
  username: string
  name: string
  email?: string
  role: 'admin' | 'leader' | 'user'
  teamId?: string
  createdAt: Date
}

// Leave types
export interface Leave {
  _id: string
  userId: string
  employeeName: string
  startDate: Date
  endDate: Date
  reason: string
  type: 'annual' | 'sick' | 'personal' | 'other'
  status: 'pending' | 'approved' | 'rejected'
  workingDays: number
  teamId: string
  createdAt: Date
}

// Team types
export interface Team {
  _id: string
  name: string
  description?: string
  leaderId: string
  memberIds: string[]
  settings: TeamSettings
  createdAt: Date
}

export interface TeamSettings {
  annualLeaveDays: number
  requireApproval: boolean
  maxConcurrentLeave: number
  workingDays: WorkingDays
}

export interface WorkingDays {
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Auth types
export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
  name: string
  role: 'admin' | 'leader' | 'user'
  teamToken?: string
  teamName?: string
}

export interface AuthResponse {
  token: string
  user: User
}

// Form types
export interface LeaveRequestForm {
  startDate: Date
  endDate: Date
  reason: string
  type: 'annual' | 'sick' | 'personal' | 'other'
}

export interface UserForm {
  username: string
  password: string
  name: string
  role: 'admin' | 'leader' | 'user'
  teamId?: string
}

export interface TeamForm {
  name: string
  description?: string
  leaderId?: string
}

// UI State types
export interface LoadingState {
  isLoading: boolean
  error?: string
}

export interface PaginationState {
  page: number
  limit: number
  total: number
}

// Calendar types
export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Leave
}

// Dashboard types
export interface DashboardStats {
  totalLeaves: number
  pendingLeaves: number
  approvedLeaves: number
  rejectedLeaves: number
  teamMembers?: number
  remainingDays?: number
}

// Filter types
export interface LeaveFilter {
  status?: 'pending' | 'approved' | 'rejected'
  type?: 'annual' | 'sick' | 'personal' | 'other'
  userId?: string
  teamId?: string
  dateFrom?: Date
  dateTo?: Date
}

export interface UserFilter {
  role?: 'admin' | 'leader' | 'user'
  teamId?: string
  search?: string
}

export interface TeamFilter {
  leaderId?: string
  search?: string
}
