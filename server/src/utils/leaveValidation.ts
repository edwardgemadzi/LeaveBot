import type { Employee, LeaveRequest, ScheduleType, ShiftType } from "../types.js";
import { AppError } from "./errors.js";

const ADVANCE_BOOKING_DAYS = 14;
const MAX_MEMBERS_PER_DAY_PER_SHIFT = 2;

/**
 * Check if a date is a work day for an employee based on their schedule
 */
export function isWorkDay(date: Date, employee: Employee): boolean {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

  switch (employee.scheduleType) {
    case "mon_fri":
      // Monday (1) to Friday (5)
      return dayOfWeek >= 1 && dayOfWeek <= 5;

    case "2_2":
    case "3_3":
    case "4_4": {
      // Rotating schedule: X days on, X days off
      if (!employee.scheduleStartDate) {
        throw new AppError("Schedule start date required for rotating schedules", 400);
      }

      const daysOn = parseInt(employee.scheduleType.split("_")[0], 10);
      const daysOff = parseInt(employee.scheduleType.split("_")[1], 10);
      const cycleLength = daysOn + daysOff;

      const startDate = new Date(employee.scheduleStartDate);
      const diffTime = date.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const positionInCycle = diffDays % cycleLength;

      return positionInCycle < daysOn;
    }

    case "custom": {
      // Custom schedule with specific work days (JSON array like [1,2,3,4,5] for Mon-Fri)
      if (!employee.workDays) {
        throw new AppError("Work days required for custom schedules", 400);
      }

      try {
        const workDaysArray: number[] = JSON.parse(employee.workDays);
        return workDaysArray.includes(dayOfWeek);
      } catch {
        throw new AppError("Invalid work days format", 400);
      }
    }

    default:
      return true;
  }
}

/**
 * Get all dates in a range
 */
function getDateRange(startDate: string, endDate: string): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Validate that all dates in the leave request are work days for the employee
 */
export function validateWorkDays(
  startDate: string,
  endDate: string,
  employee: Employee
): { valid: boolean; nonWorkDays: string[] } {
  const dates = getDateRange(startDate, endDate);
  const nonWorkDays: string[] = [];

  for (const date of dates) {
    if (!isWorkDay(date, employee)) {
      nonWorkDays.push(date.toISOString().split("T")[0]);
    }
  }

  return {
    valid: nonWorkDays.length === 0,
    nonWorkDays,
  };
}

/**
 * Validate 14-day advance booking rule
 */
export function validateAdvanceBooking(
  startDate: string,
  employee: Employee,
  isEmergency: boolean = false
): { valid: boolean; message?: string } {
  // Admin and supervisors can bypass, or if marked as emergency
  if (employee.role === "admin" || employee.role === "supervisor" || isEmergency) {
    return { valid: true };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const requestedDate = new Date(startDate);
  requestedDate.setHours(0, 0, 0, 0);

  const diffTime = requestedDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < ADVANCE_BOOKING_DAYS) {
    return {
      valid: false,
      message: `Leave must be booked at least ${ADVANCE_BOOKING_DAYS} days in advance. You are ${ADVANCE_BOOKING_DAYS - diffDays} days short.`,
    };
  }

  return { valid: true };
}

/**
 * Count approved leave requests per day per shift
 */
export function countLeavesByDateAndShift(
  date: string,
  shift: ShiftType,
  existingRequests: LeaveRequest[],
  employees: Map<number, Employee>
): number {
  return existingRequests.filter((req) => {
    if (req.status !== "approved" && req.status !== "pending") {
      return false;
    }

    const employee = employees.get(req.employeeId);
    if (!employee || employee.shift !== shift) {
      return false;
    }

    // Check if date falls within the request range
    return date >= req.startDate && date <= req.endDate;
  }).length;
}

/**
 * Validate maximum members per day per shift
 */
export function validateMaxMembersPerDay(
  startDate: string,
  endDate: string,
  employee: Employee,
  existingRequests: LeaveRequest[],
  employees: Map<number, Employee>
): { valid: boolean; conflictDates: string[] } {
  const dates = getDateRange(startDate, endDate);
  const conflictDates: string[] = [];

  for (const date of dates) {
    const dateStr = date.toISOString().split("T")[0];
    const count = countLeavesByDateAndShift(
      dateStr,
      employee.shift,
      existingRequests,
      employees
    );

    if (count >= MAX_MEMBERS_PER_DAY_PER_SHIFT) {
      conflictDates.push(dateStr);
    }
  }

  return {
    valid: conflictDates.length === 0,
    conflictDates,
  };
}

/**
 * Main validation function for leave requests
 */
export interface LeaveValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateLeaveRequest(
  startDate: string,
  endDate: string,
  employee: Employee,
  existingRequests: LeaveRequest[],
  employees: Map<number, Employee>,
  isEmergency: boolean = false
): LeaveValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Validate work days
  const workDayCheck = validateWorkDays(startDate, endDate, employee);
  if (!workDayCheck.valid) {
    errors.push(
      `The following dates are not work days according to your schedule: ${workDayCheck.nonWorkDays.join(", ")}`
    );
  }

  // 2. Validate advance booking (only for team members)
  const advanceCheck = validateAdvanceBooking(startDate, employee, isEmergency);
  if (!advanceCheck.valid) {
    if (isEmergency) {
      warnings.push("Emergency leave: bypassing advance booking requirement");
    } else {
      errors.push(advanceCheck.message!);
    }
  }

  // 3. Validate maximum members per day per shift
  const maxMembersCheck = validateMaxMembersPerDay(
    startDate,
    endDate,
    employee,
    existingRequests,
    employees
  );
  if (!maxMembersCheck.valid) {
    errors.push(
      `Maximum ${MAX_MEMBERS_PER_DAY_PER_SHIFT} team members from your shift already have leave on: ${maxMembersCheck.conflictDates.join(", ")}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
