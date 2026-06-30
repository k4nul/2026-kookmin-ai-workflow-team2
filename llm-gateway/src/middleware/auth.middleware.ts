import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

export function requireInternalApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.header("X-Internal-Api-Key");

  if (apiKey !== env.INTERNAL_API_KEY) {
    res.status(401).json({
      ok: false,
      error: "UNAUTHORIZED",
      message: "Invalid internal API key."
    });
    return;
  }

  next();
}
