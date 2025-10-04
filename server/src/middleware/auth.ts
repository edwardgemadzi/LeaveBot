import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";
import type { AuthStore } from "../store/authStore";
import type { AuthContext } from "../types.js";

export interface AuthenticatedRequest extends Request {
  auth?: AuthContext;
}

export function createAuthMiddleware(authStore: AuthStore) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AppError("Authentication required", 401);
      }

      const token = authHeader.substring(7);
      const session = await authStore.validateSession(token);

      if (!session) {
        throw new AppError("Invalid or expired token", 401);
      }

      const user = await authStore.getUserById(session.user_id);

      if (!user) {
        throw new AppError("User not found", 401);
      }

      req.auth = {
        userId: user.id,
        role: user.role,
        supervisorId: user.supervisor_id,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new AppError("Authentication required", 401));
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return next(new AppError("Insufficient permissions", 403));
    }

    next();
  };
}

export function requireSupervisorOrAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.auth) {
    return next(new AppError("Authentication required", 401));
  }

  if (req.auth.role !== "admin" && req.auth.role !== "supervisor") {
    return next(new AppError("Supervisor or admin access required", 403));
  }

  next();
}
