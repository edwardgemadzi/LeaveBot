import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("Error:", err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      context: err.context
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      issues: err.errors
    });
    return;
  }

  res.status(500).json({
    error: "Internal server error"
  });
}
