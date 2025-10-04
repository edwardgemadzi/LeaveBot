export interface Employee {
  id: number;
  name: string;
  createdAt: string;
}

export interface LeaveRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  startDate: string;
  endDate: string;
  status: "pending" | "approved";
  reason: string | null;
  createdAt: string;
  approvedAt: string | null;
}

export interface CalendarDay {
  date: string;
  status: "available" | "pending" | "approved";
  requests: Array<{
    id: number;
    employeeId: number;
    employeeName: string;
    status: "pending" | "approved";
  }>;
}

export interface ApiResponse<T> {
  [key: string]: T;
}
