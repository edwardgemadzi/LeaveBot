import { promises as fs } from "fs";
import path from "path";
import initSqlJs, { type Database as SqlDatabase } from "sql.js";
import { fileURLToPath } from "url";

import { AppError } from "../utils/errors.js";
import { expandDateRange } from "../utils/dates.js";
import type { CalendarDay, Employee, LeaveRequest, LeaveStatus } from "../types.js";

interface OpenOptions {
  dbFilePath?: string;
  persist?: boolean;
}

async function readWasmBinary() {
  // sql.js is in the server's node_modules
  const rootDir = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../../");
  const wasmPath = path.resolve(rootDir, "node_modules/sql.js/dist/sql-wasm.wasm");
  const data = await fs.readFile(wasmPath);
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

function resolveDefaultDbPath(): string {
  const rootDir = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../../");
  return path.resolve(rootDir, "data/leavebot.sqlite");
}

export class LeaveStore {
  private db: SqlDatabase | null = null;
  private persistToFile: boolean = true;
  private dbFilePath: string | null = null;

  private constructor() {}

  public static async open(options: OpenOptions = {}): Promise<LeaveStore> {
    const store = new LeaveStore();
    
    const wasmBinary = await readWasmBinary();
    const SQL = await initSqlJs({ wasmBinary: wasmBinary as ArrayBuffer });

    store.persistToFile = options.persist ?? true;
    store.dbFilePath = options.dbFilePath ?? resolveDefaultDbPath();

    if (store.persistToFile && (await fileExists(store.dbFilePath))) {
      const file = await fs.readFile(store.dbFilePath);
      store.db = new SQL.Database(new Uint8Array(file));
    } else {
      store.db = new SQL.Database();
    }

    store.initialize();
    return store;
  }

  private ensureOpen(): void {
    if (!this.db) {
      throw new AppError("Database is not open", 500);
    }
  }

  private initialize(): void {
    this.ensureOpen();
    
    this.db!.exec(`
      PRAGMA foreign_keys = OFF;
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        telegram_username TEXT UNIQUE,
        telegram_chat_id INTEGER,
        user_id INTEGER UNIQUE,
        supervisor_id INTEGER DEFAULT 1,
        role TEXT NOT NULL CHECK(role IN ('admin', 'supervisor', 'team_member')) DEFAULT 'team_member',
        shift TEXT NOT NULL CHECK(shift IN ('day', 'night', 'evening', 'rotating')) DEFAULT 'day',
        schedule_type TEXT NOT NULL CHECK(schedule_type IN ('mon_fri', '2_2', '3_3', '4_4', 'custom')) DEFAULT 'mon_fri',
        schedule_start_date TEXT,
        work_days TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS leave_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        supervisor_id INTEGER DEFAULT 1,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
        reason TEXT,
        is_emergency INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        approved_at TEXT,
        approved_by INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
      CREATE INDEX IF NOT EXISTS idx_leave_requests_supervisor ON leave_requests(supervisor_id);
      CREATE INDEX IF NOT EXISTS idx_employees_supervisor ON employees(supervisor_id);
      CREATE INDEX IF NOT EXISTS idx_employees_telegram ON employees(telegram_username);
      CREATE INDEX IF NOT EXISTS idx_employees_shift ON employees(shift);
    `);
  }

  private async persist(): Promise<void> {
    if (!this.persistToFile || !this.dbFilePath || !this.db) {
      return;
    }

    const data = this.db.export();
    await fs.mkdir(path.dirname(this.dbFilePath), { recursive: true });
    await fs.writeFile(this.dbFilePath, Buffer.from(data));
  }

  public async listEmployees(): Promise<Employee[]> {
    this.ensureOpen();

    const sql = `
      SELECT 
        id, name, user_id, supervisor_id, role, shift, 
        schedule_type as scheduleType, schedule_start_date as scheduleStartDate,
        work_days as workDays, created_at as createdAt 
      FROM employees
    `;
    const results: Employee[] = [];

    try {
      const stmt = this.db!.prepare(sql);
      stmt.bind();

      while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push({
          id: Number(row.id),
          name: String(row.name),
          user_id: row.user_id ? Number(row.user_id) : null,
          supervisor_id: row.supervisor_id ? Number(row.supervisor_id) : 0,
          role: (row.role as any) || 'team_member',
          shift: (row.shift as any) || 'day',
          scheduleType: (row.scheduleType as any) || 'mon_fri',
          scheduleStartDate: row.scheduleStartDate ? String(row.scheduleStartDate) : null,
          workDays: row.workDays ? String(row.workDays) : null,
          createdAt: String(row.createdAt)
        });
      }
      stmt.free();
      return results;
    } catch (error) {
      throw new AppError("Failed to list employees", 500);
    }
  }

  public async getEmployee(id: number): Promise<Employee | null> {
    this.ensureOpen();

    const sql = `
      SELECT 
        id, name, user_id, supervisor_id, role, shift,
        schedule_type as scheduleType, schedule_start_date as scheduleStartDate,
        work_days as workDays, created_at as createdAt 
      FROM employees 
      WHERE id = $id
    `;

    try {
      const stmt = this.db!.prepare(sql);
      stmt.bind({ $id: id });

      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return {
          id: Number(row.id),
          name: String(row.name),
          user_id: row.user_id ? Number(row.user_id) : null,
          supervisor_id: row.supervisor_id ? Number(row.supervisor_id) : 0,
          role: (row.role as any) || 'team_member',
          shift: (row.shift as any) || 'day',
          scheduleType: (row.scheduleType as any) || 'mon_fri',
          scheduleStartDate: row.scheduleStartDate ? String(row.scheduleStartDate) : null,
          workDays: row.workDays ? String(row.workDays) : null,
          createdAt: String(row.createdAt)
        };
      }
      stmt.free();
      return null;
    } catch (error) {
      throw new AppError("Failed to get employee", 500);
    }
  }

  public async createEmployee(name: string): Promise<Employee> {
    this.ensureOpen();
    
    const insert = this.db!.prepare(`INSERT INTO employees (name, supervisor_id) VALUES ($name, 1)`);

    try {
      insert.run({ $name: name });
    } catch (error) {
      throw new AppError("Employee name must be unique", 409, { name });
    } finally {
      insert.free();
    }

    const id = this.lastInsertId();
    const employee = await this.getEmployee(id);

    if (!employee) {
      throw new AppError("Failed to create employee", 500);
    }

    await this.persist();
    return employee;
  }

  public async getEmployeeByTelegram(username: string): Promise<Employee | null> {
    this.ensureOpen();

    const sql = `
      SELECT 
        id, name, user_id, supervisor_id, role, shift,
        schedule_type as scheduleType, schedule_start_date as scheduleStartDate,
        work_days as workDays, created_at as createdAt 
      FROM employees 
      WHERE telegram_username = $username
    `;

    try {
      const stmt = this.db!.prepare(sql);
      stmt.bind({ $username: username });

      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return {
          id: Number(row.id),
          name: String(row.name),
          user_id: row.user_id ? Number(row.user_id) : null,
          supervisor_id: row.supervisor_id ? Number(row.supervisor_id) : 0,
          role: (row.role as any) || 'team_member',
          shift: (row.shift as any) || 'day',
          scheduleType: (row.scheduleType as any) || 'mon_fri',
          scheduleStartDate: row.scheduleStartDate ? String(row.scheduleStartDate) : null,
          workDays: row.workDays ? String(row.workDays) : null,
          createdAt: String(row.createdAt)
        };
      }
      stmt.free();
      return null;
    } catch (error) {
      throw new AppError("Failed to get employee by Telegram", 500);
    }
  }

  public async findOrCreateEmployeeByTelegram(username: string, name: string, chatId: number): Promise<Employee> {
    this.ensureOpen();

    // Check if employee exists
    let employee = await this.getEmployeeByTelegram(username);
    
    if (employee) {
      return employee;
    }

    // Create new employee
    const insert = this.db!.prepare(`
      INSERT INTO employees (name, telegram_username, telegram_chat_id, supervisor_id, role, shift, schedule_type) 
      VALUES ($name, $username, $chatId, 1, 'team_member', 'day', 'mon_fri')
    `);

    try {
      insert.run({ $name: name, $username: username, $chatId: chatId });
    } catch (error) {
      throw new AppError("Failed to create employee from Telegram", 500);
    } finally {
      insert.free();
    }

    const id = this.lastInsertId();
    employee = await this.getEmployee(id);

    if (!employee) {
      throw new AppError("Failed to create employee", 500);
    }

    await this.persist();
    return employee;
  }

  public async updateEmployeeSchedule(
    id: number,
    update: {
      role?: string;
      shift?: string;
      scheduleType?: string;
      scheduleStartDate?: string;
      workDays?: string;
    }
  ): Promise<Employee> {
    this.ensureOpen();

    const employee = await this.getEmployee(id);
    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    const updates: string[] = [];
    const params: Record<string, any> = { $id: id };

    if (update.role) {
      updates.push("role = $role");
      params.$role = update.role;
    }
    if (update.shift) {
      updates.push("shift = $shift");
      params.$shift = update.shift;
    }
    if (update.scheduleType) {
      updates.push("schedule_type = $scheduleType");
      params.$scheduleType = update.scheduleType;
    }
    if (update.scheduleStartDate) {
      updates.push("schedule_start_date = $scheduleStartDate");
      params.$scheduleStartDate = update.scheduleStartDate;
    }
    if (update.workDays !== undefined) {
      updates.push("work_days = $workDays");
      params.$workDays = update.workDays;
    }

    if (updates.length === 0) {
      return employee;
    }

    const sql = `UPDATE employees SET ${updates.join(", ")} WHERE id = $id`;
    const stmt = this.db!.prepare(sql);

    try {
      stmt.run(params);
    } catch (error) {
      throw new AppError("Failed to update employee schedule", 500);
    } finally {
      stmt.free();
    }

    await this.persist();
    
    const updated = await this.getEmployee(id);
    if (!updated) {
      throw new AppError("Failed to retrieve updated employee", 500);
    }

    return updated;
  }

  public async updateEmployeeSupervisor(id: number, supervisorId: number): Promise<Employee> {
    this.ensureOpen();

    const employee = await this.getEmployee(id);
    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    const stmt = this.db!.prepare("UPDATE employees SET supervisor_id = $supervisorId WHERE id = $id");

    try {
      stmt.run({ $id: id, $supervisorId: supervisorId });
    } catch (error) {
      throw new AppError("Failed to update employee supervisor", 500);
    } finally {
      stmt.free();
    }

    await this.persist();
    
    const updated = await this.getEmployee(id);
    if (!updated) {
      throw new AppError("Failed to retrieve updated employee", 500);
    }

    return updated;
  }

  public listLeaveRequests(filter: {
    startDate?: string;
    endDate?: string;
  } = {}): LeaveRequest[] {
    this.ensureOpen();
    
    const conditions: string[] = [];
    const params: Record<string, string> = {};

    if (filter.startDate) {
      conditions.push("lr.end_date >= $startDate");
      params.$startDate = filter.startDate;
    }

    if (filter.endDate) {
      conditions.push("lr.start_date <= $endDate");
      params.$endDate = filter.endDate;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT 
        lr.id,
        lr.employee_id,
        e.name as employee_name,
        lr.supervisor_id,
        lr.start_date,
        lr.end_date,
        lr.status,
        lr.reason,
        lr.is_emergency,
        lr.created_at,
        lr.approved_at,
        lr.approved_by
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      ${whereClause}
      ORDER BY lr.created_at DESC
    `;

    const stmt = this.db!.prepare(sql);
    stmt.bind(params);

    const results: LeaveRequest[] = [];

    try {
      while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push(this.mapLeaveRow(row));
      }
    } finally {
      stmt.free();
    }

    return results;
  }

  public getLeaveRequest(id: number): LeaveRequest | null {
    this.ensureOpen();
    
    const sql = `
      SELECT 
        lr.id,
        lr.employee_id,
        e.name as employee_name,
        lr.supervisor_id,
        lr.start_date,
        lr.end_date,
        lr.status,
        lr.reason,
        lr.is_emergency,
        lr.created_at,
        lr.approved_at,
        lr.approved_by
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      WHERE lr.id = $id
    `;

    const stmt = this.db!.prepare(sql);
    stmt.bind({ $id: id });

    try {
      if (stmt.step()) {
        return this.mapLeaveRow(stmt.getAsObject());
      }
      return null;
    } finally {
      stmt.free();
    }
  }

  public async createLeaveRequest(input: {
    employeeId: number;
    startDate: string;
    endDate: string;
    reason?: string | null;
    isEmergency?: boolean;
  }): Promise<LeaveRequest> {
    this.ensureOpen();
    
    const employee = await this.getEmployee(input.employeeId);

    if (!employee) {
      throw new AppError("Employee not found", 404, { employeeId: input.employeeId });
    }

    this.assertNoConflict(input.employeeId, input.startDate, input.endDate);

    const insert = this.db!.prepare(
      `INSERT INTO leave_requests (employee_id, supervisor_id, start_date, end_date, status, reason, is_emergency)
       VALUES ($employeeId, $supervisorId, $startDate, $endDate, 'pending', $reason, $isEmergency)`
    );

    insert.run({
      $employeeId: input.employeeId,
      $supervisorId: employee.supervisor_id,
      $startDate: input.startDate,
      $endDate: input.endDate,
      $reason: input.reason ?? null,
      $isEmergency: input.isEmergency ? 1 : 0
    });

    insert.free();

    const id = this.lastInsertId();
    const record = this.getLeaveRequest(id);

    if (!record) {
      throw new AppError("Failed to create leave request", 500);
    }

    await this.persist();
    return record;
  }

  public async validateLeaveRequest(input: {
    employeeId: number;
    startDate: string;
    endDate: string;
    isEmergency?: boolean;
  }): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    this.ensureOpen();

    const employee = await this.getEmployee(input.employeeId);
    if (!employee) {
      return {
        valid: false,
        errors: ["Employee not found"],
        warnings: []
      };
    }

    // Get all employees and leave requests for validation
    const employees = await this.listEmployees();
    const employeeMap = new Map(employees.map(e => [e.id, e]));
    
    const leaveRequests = this.listLeaveRequests({
      startDate: input.startDate,
      endDate: input.endDate
    });

    // Import validation utility
    const { validateLeaveRequest } = await import("../utils/leaveValidation.js");
    
    return validateLeaveRequest(
      input.startDate,
      input.endDate,
      employee,
      leaveRequests,
      employeeMap,
      input.isEmergency || false
    );
  }

  public async approveLeaveRequest(id: number): Promise<LeaveRequest> {
    this.ensureOpen();
    
    const existing = this.getLeaveRequest(id);

    if (!existing) {
      throw new AppError("Leave request not found", 404, { id });
    }

    const update = this.db!.prepare(
      `UPDATE leave_requests
       SET status = 'approved', approved_at = CURRENT_TIMESTAMP
       WHERE id = $id`
    );

    update.run({ $id: id });
    update.free();

    const updated = this.getLeaveRequest(id);

    if (!updated) {
      throw new AppError("Failed to approve leave request", 500);
    }

    await this.persist();
    return updated;
  }

  public getCalendar(startDate: string, endDate: string): CalendarDay[] {
    const rangeDates = expandDateRange(startDate, endDate);
    const requests = this.listLeaveRequests({ startDate, endDate });

    const dayMap = new Map<string, CalendarDay>();
    for (const date of rangeDates) {
      dayMap.set(date, { date, status: "available", requests: [] });
    }

    for (const request of requests) {
      const requestRange = expandDateRange(request.startDate, request.endDate);
      for (const date of requestRange) {
        const day = dayMap.get(date);
        if (!day) {
          continue;
        }
        day.requests.push({
          id: request.id,
          employeeId: request.employeeId,
          employeeName: request.employeeName,
          status: request.status
        });
      }
    }

    for (const day of dayMap.values()) {
      if (day.requests.some((request: any) => request.status === "approved")) {
        day.status = "approved";
      } else if (day.requests.length > 0) {
        day.status = "pending";
      } else {
        day.status = "available";
      }
    }

    return Array.from(dayMap.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  public clearAll(): void {
    this.ensureOpen();
    this.db!.exec("DELETE FROM leave_requests; DELETE FROM employees;");
  }

  private lastInsertId(): number {
    const result = this.db!.exec("SELECT last_insert_rowid() as id");
    const idValue = result[0]?.values?.[0]?.[0];
    if (typeof idValue !== "number") {
      throw new AppError("Failed to retrieve inserted id", 500);
    }
    return idValue;
  }

  private mapLeaveRow(row: any): LeaveRequest {
    return {
      id: Number(row.id),
      employeeId: Number(row.employee_id),
      employeeName: String(row.employee_name),
      supervisorId: Number(row.supervisor_id),
      startDate: String(row.start_date),
      endDate: String(row.end_date),
      status: String(row.status) as LeaveStatus,
      reason: row.reason ? String(row.reason) : null,
      isEmergency: Boolean(row.is_emergency),
      createdAt: String(row.created_at),
      approvedAt: row.approved_at ? String(row.approved_at) : null,
      approvedBy: row.approved_by ? Number(row.approved_by) : null,
    };
  }

  private assertNoConflict(employeeId: number, startDate: string, endDate: string): void {
    const stmt = this.db!.prepare(
      `SELECT COUNT(1) as conflictCount
       FROM leave_requests
       WHERE employee_id = $employeeId
         AND end_date >= $startDate
         AND start_date <= $endDate`
    );

    stmt.bind({
      $employeeId: employeeId,
      $startDate: startDate,
      $endDate: endDate
    });

    try {
      if (stmt.step()) {
        const row = stmt.getAsObject();
        const count = Number(row.conflictCount);
        if (count > 0) {
          throw new AppError("Employee already has leave during this period", 409, {
            employeeId,
            startDate,
            endDate
          });
        }
      }
    } finally {
      stmt.free();
    }
  }
}
