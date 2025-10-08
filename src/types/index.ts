// Centralized type definitions for the LeaveBot application

export interface User {
  id: string
  _id?: string
  username: string
  name: string
  role: 'admin' | 'leader' | 'user'
  teamId?: string
  createdAt?: string
  leaveBalance?: {
    total: number
    used: number
    remaining: number
  }
}

export interface Leave {
  _id: string
  id?: string
  employeeName: string
  userId: string
  startDate: string
  endDate: string
  leaveType?: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  workingDaysCount?: number
  calendarDaysCount?: number
  shiftPattern?: string
  shiftTime?: string
  teamId?: string
}

export interface Team {
  _id: string
  id?: string
  name: string
  description?: string
  leaderId: string
  leaderName?: string
  members?: string[]
  memberCount?: number
  settings?: TeamSettings
  createdAt: string
}

export interface TeamSettings {
  annualLeaveDays?: number
  maxConcurrentLeave?: number
  shiftPattern?: ShiftPattern
  shiftTime?: ShiftTime
  concurrentLeave?: {
    enabled: boolean
    maxPerTeam: number
  }
}

export interface UserSettings {
  shiftPattern: ShiftPattern
  shiftTime: ShiftTime
}

export interface ShiftPattern {
  type: 'regular' | '2-2' | '3-3' | '4-4' | '5-5' | 'custom'
  customPattern?: string
  referenceDate?: string
}

export interface ShiftTime {
  type: 'day' | 'night' | 'custom'
  customStart?: string
  customEnd?: string
}

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Leave
}

export interface DateRange {
  start: Date
  end: Date
}

export interface WorkingDaysResult {
  count: number
  calendarDays: number
  dates: string[]
  warning?: string
  shiftPattern?: string
  shiftTime?: string
  concurrentInfo?: {
    count: number
    limit: number
    enabled: boolean
  }
}
