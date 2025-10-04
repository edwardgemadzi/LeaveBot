import { Router, type Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import type { AuthStore } from "../store/authStore.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireRole } from "../middleware/auth.js";
import { AppError } from "../utils/errors.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const createUserSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "supervisor", "team_member"]),
  supervisorId: z.number().int().positive().optional().nullable(),
});

export function createAuthRouter(authStore: AuthStore): Router {
  const router = Router();

  // POST /auth/login
  router.post(
    "/login",
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        throw new AppError("Invalid request data", 400);
      }

      const { email, password } = result.data;
      const loginResult = await authStore.login({ email, password });

      if (!loginResult) {
        throw new AppError("Invalid credentials", 401);
      }

      res.json({
        token: loginResult.token,
        user: {
          id: loginResult.user.id,
          name: loginResult.user.name,
          email: loginResult.user.email,
          role: loginResult.user.role,
          supervisorId: loginResult.user.supervisorId,
        },
      });
    })
  );

  // POST /auth/logout
  router.post(
    "/logout",
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      if (!req.auth) {
        throw new AppError("Unauthorized", 401);
      }

      const token = req.headers.authorization?.replace("Bearer ", "");
      if (token) {
        authStore.logout(token);
      }

      res.json({ message: "Logged out successfully" });
    })
  );

  // POST /auth/users - Create new user (admin or supervisor)
  router.post(
    "/users",
    requireRole("admin", "supervisor"),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const parsed = createUserSchema.parse(req.body);
      
      // Supervisors can only create team members under themselves
      if (req.auth?.role === "supervisor") {
        if (parsed.role !== "team_member") {
          res.status(403).json({ error: "Supervisors can only create team members" });
          return;
        }
        parsed.supervisorId = req.auth.userId;
      }

      const user = await authStore.createUser(parsed, req.auth?.role);
      
      // Don't return password hash
      const { password_hash, ...safeUser } = user;
      res.status(201).json({ user: safeUser });
    })
  );

  // GET /auth/users/me - Get current user
  router.get(
    "/users/me",
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      if (!req.auth) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const user = await authStore.getUserById(req.auth.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const { password_hash, ...safeUser } = user;
      res.json({ user: safeUser });
    })
  );

  // GET /auth/team-members - Get team members (supervisors see their team, admins see all)
  router.get(
    "/team-members",
    requireRole("admin", "supervisor"),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      let users;
      
      if (req.auth?.role === "admin") {
        // Admin sees all team members
        users = await authStore.getTeamMembers(0); // 0 will need special handling
      } else if (req.auth?.role === "supervisor") {
        // Supervisor sees only their team
        users = await authStore.getTeamMembers(req.auth.userId);
      }

      const safeUsers = users?.map(({ password_hash, ...user }) => user) || [];
      res.json({ users: safeUsers });
    })
  );

  // GET /auth/supervisors - Get all supervisors (admin only)
  router.get(
    "/supervisors",
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const supervisors = await authStore.getAllSupervisors();
      const safeSupervisors = supervisors.map(({ password_hash, ...user }) => user);
      res.json({ supervisors: safeSupervisors });
    })
  );

  // DELETE /auth/users/:id - Delete user (admin or supervisor for their team)
  router.delete(
    "/users/:id",
    requireRole("admin", "supervisor"),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const userId = parseInt(req.params.id, 10);

      if (isNaN(userId)) {
        res.status(400).json({ error: "Invalid user ID" });
        return;
      }

      // Supervisors can only delete their own team members
      if (req.auth?.role === "supervisor") {
        const user = await authStore.getUserById(userId);
        if (!user || user.supervisor_id !== req.auth.userId) {
          res.status(403).json({ error: "Can only delete your own team members" });
          return;
        }
      }

      authStore.deleteUser(userId, req.auth?.role || "");
      res.json({ message: "User deleted successfully" });
    })
  );

  return router;
}
