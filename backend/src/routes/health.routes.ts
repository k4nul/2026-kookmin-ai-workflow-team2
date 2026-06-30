import { Router } from "express";
import { env } from "../config/env.js";

export function healthRoutes(): Router {
  const router = Router();

  router.get("/health", async (_req, res) => {
    const reachable = await isLlmGatewayReachable();
    res.json({
      ok: true,
      service: "game-backend",
      port: env.PORT,
      llmGateway: {
        baseUrl: env.LLM_GATEWAY_BASE_URL,
        model: env.LLM_GATEWAY_MODEL,
        reachable
      }
    });
  });

  return router;
}

async function isLlmGatewayReachable(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch(`${env.LLM_GATEWAY_BASE_URL}/health`, {
      method: "GET",
      signal: controller.signal
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
