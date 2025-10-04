import type { Employee, LeaveRequest, CalendarDay } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  getEmployees: () => fetchApi<{ employees: Employee[] }>("/employees"),
  
  createEmployee: (name: string) =>
    fetchApi<{ employee: Employee }>("/employees", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  getLeaveRequests: () => fetchApi<{ requests: LeaveRequest[] }>("/leave-requests"),

  createLeaveRequest: (data: {
    employeeId: number;
    startDate: string;
    endDate: string;
    reason?: string;
  }) =>
    fetchApi<{ request: LeaveRequest }>("/leave-requests", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  approveLeaveRequest: (id: number) =>
    fetchApi<{ request: LeaveRequest }>(`/leave-requests/${id}/approve`, {
      method: "POST",
    }),

  getCalendar: (startDate: string, endDate: string) =>
    fetchApi<{ calendar: CalendarDay[] }>(`/calendar?startDate=${startDate}&endDate=${endDate}`),
};
