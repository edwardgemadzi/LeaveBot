export type UserRole = "admin" | "supervisor" | "team_member";
export type LeaveStatus = "pending" | "approved" | "rejected";
export type ShiftType = "day" | "night" | "evening" | "rotating";
export type ScheduleType = "mon_fri" | "2_2" | "3_3" | "4_4" | "custom";

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  supervisor_id: number | null; // null for admin and supervisors
  telegram_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  user_id: number;
  token: string;
  expires_at: string;
}

export interface Employee {
  id: number;
  name: string;
  user_id: number | null; // Link to user account
  supervisor_id: number; // The supervisor who manages this employee
  role: UserRole;
  shift: ShiftType;
  scheduleType: ScheduleType;
  scheduleStartDate: string | null;
  workDays: string | null; // JSON array for custom schedules or specific days
  createdAt: string;
}

export interface LeaveRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  supervisorId: number; // The supervisor responsible for approval
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  reason: string | null;
  isEmergency: boolean;
  createdAt: string;
  approvedAt: string | null;
  approvedBy: number | null; // user_id of approver
}

export interface CalendarDay {
  date: string;
  status: "available" | "pending" | "approved";
  requests: Array<{
    id: number;
    employeeId: number;
    employeeName: string;
    status: LeaveStatus;
  }>;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    supervisorId: number | null;
  };
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  supervisorId?: number | null;
}

export interface AuthContext {
  userId: number;
  role: UserRole;
  supervisorId: number | null;
}
