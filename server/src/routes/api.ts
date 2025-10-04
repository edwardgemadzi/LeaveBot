import { Router, type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import type { LeaveStore } from "../store/leaveStore.js";
import { AppError } from "../utils/errors.js";

const createEmployeeSchema = z.object({
  name: z.string().min(1).max(255)
});

const createLeaveRequestSchema = z.object({
  employeeId: z.number().int().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional().nullable()
});

const getCalendarSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export function createApiRouter(store: LeaveStore): Router {
  const router = Router();

  // GET /api/employees
  router.get(
    "/employees",
    asyncHandler(async (_req: Request, res: Response) => {
      const employees = await store.listEmployees();
      res.json({ employees });
    })
  );

  // POST /api/employees
  router.post(
    "/employees",
    asyncHandler(async (req: Request, res: Response) => {
      const parsed = createEmployeeSchema.parse(req.body);
      const employee = await store.createEmployee(parsed.name);
      res.status(201).json({ employee });
    })
  );

  // PUT /api/employees/:id/schedule - Update employee work schedule
  router.put(
    "/employees/:id/schedule",
    asyncHandler(async (req: Request, res: Response) => {
      const id = parseInt(req.params.id, 10);
      const { role, shift, scheduleType, scheduleStartDate, workDays } = req.body;

      if (Number.isNaN(id)) {
        throw new AppError("Invalid employee ID", 400);
      }

      const employee = await store.updateEmployeeSchedule(id, {
        role,
        shift,
        scheduleType,
        scheduleStartDate,
        workDays,
      });

      res.json({ employee });
    })
  );

  // PUT /api/employees/:id/supervisor - Update employee's supervisor
  router.put(
    "/employees/:id/supervisor",
    asyncHandler(async (req: Request, res: Response) => {
      const id = parseInt(req.params.id, 10);
      const { supervisorId } = req.body;

      if (Number.isNaN(id)) {
        throw new AppError("Invalid employee ID", 400);
      }

      if (!supervisorId) {
        throw new AppError("supervisorId is required", 400);
      }

      const employee = await store.updateEmployeeSupervisor(id, supervisorId);
      res.json({ employee });
    })
  );

  // PUT /api/employees/:id/role - Update employee's role (admin only)
  router.put(
    "/employees/:id/role",
    asyncHandler(async (req: Request, res: Response) => {
      const id = parseInt(req.params.id, 10);
      const { role } = req.body;

      if (Number.isNaN(id)) {
        throw new AppError("Invalid employee ID", 400);
      }

      if (!role || !["admin", "supervisor", "team_member"].includes(role)) {
        throw new AppError("Valid role is required (admin, supervisor, or team_member)", 400);
      }

      const employee = await store.updateEmployeeSchedule(id, { role });
      res.json({ employee });
    })
  );

  // GET /api/leave-requests
  router.get(
    "/leave-requests",
    asyncHandler(async (req: Request, res: Response) => {
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const requests = await store.listLeaveRequests({ startDate, endDate });
      res.json({ requests });
    })
  );

  // POST /api/leave-requests/validate - Validate leave request without creating
  router.post(
    "/leave-requests/validate",
    asyncHandler(async (req: Request, res: Response) => {
      const { employeeId, startDate, endDate, isEmergency } = req.body;
      
      if (!employeeId || !startDate || !endDate) {
        throw new AppError("employeeId, startDate, and endDate are required", 400);
      }

      const validation = await store.validateLeaveRequest({
        employeeId,
        startDate,
        endDate,
        isEmergency: isEmergency || false
      });

      res.json(validation);
    })
  );

  // POST /api/leave-requests
  router.post(
    "/leave-requests",
    asyncHandler(async (req: Request, res: Response) => {
      const parsed = createLeaveRequestSchema.parse(req.body);
      
      // Validate before creating
      const validation = await store.validateLeaveRequest({
        employeeId: parsed.employeeId,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        isEmergency: (parsed as any).isEmergency || false
      });

      if (!validation.valid) {
        throw new AppError(validation.errors.join("; "), 400);
      }

      const request = await store.createLeaveRequest({
        ...parsed,
        isEmergency: (parsed as any).isEmergency || false
      });
      
      res.status(201).json({ 
        request,
        warnings: validation.warnings
      });
    })
  );

  // POST /api/leave-requests/:id/approve
  router.post(
    "/leave-requests/:id/approve",
    asyncHandler(async (req: Request, res: Response) => {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        throw new AppError("Invalid leave request ID", 400);
      }
      const request = await store.approveLeaveRequest(id);
      res.json({ request });
    })
  );

  // GET /api/calendar
  router.get(
    "/calendar",
    asyncHandler(async (req: Request, res: Response) => {
      const parsed = getCalendarSchema.parse(req.query);
      const calendar = await store.getCalendar(parsed.startDate, parsed.endDate);
      res.json({ calendar });
    })
  );

  // POST /api/telegram/register - Register/find employee by Telegram username
  router.post(
    "/telegram/register",
    asyncHandler(async (req: Request, res: Response) => {
      const { username, name, chatId } = req.body;
      
      if (!username || !name || !chatId) {
        throw new AppError("username, name, and chatId are required", 400);
      }

      const employee = await store.findOrCreateEmployeeByTelegram(username, name, chatId);
      res.json({ employee });
    })
  );

  // GET /api/telegram/employee/:username - Get employee by Telegram username
  router.get(
    "/telegram/employee/:username",
    asyncHandler(async (req: Request, res: Response) => {
      const { username } = req.params;
      const employee = await store.getEmployeeByTelegram(username);
      
      if (!employee) {
        throw new AppError("Employee not found", 404);
      }

      res.json({ employee });
    })
  );

  return router;
}
