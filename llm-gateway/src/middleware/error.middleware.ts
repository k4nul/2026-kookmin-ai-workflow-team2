import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { isDevelopment } from "../config/env.js";
import { formatZodIssues } from "../services/schema.service.js";

type HttpErrorLike = Error & {
  statusCode?: number;
  code?: string;
};

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      ok: false,
      error: "INVALID_REQUEST",
      message: "Request body validation failed.",
      details: formatZodIssues(error.issues)
    });
    return;
  }

  const httpError = normalizeError(error);
  const statusCode = httpError.statusCode ?? 500;
  const body: {
    ok: false;
    error: string;
    message: string;
    stack?: string;
  } = {
    ok: false,
    error: httpError.code ?? "INTERNAL_SERVER_ERROR",
    message: statusCode >= 500 ? "Internal server error." : httpError.message
  };

  if (isDevelopment && httpError.stack) {
    body.stack = httpError.stack;
  }

  res.status(statusCode).json(body);
}

function normalizeError(error: unknown): HttpErrorLike {
  if (error instanceof Error) {
    return error;
  }

  return new Error("Unknown error.");
}
