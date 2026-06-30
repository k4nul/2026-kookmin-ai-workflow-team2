import { Router } from "express";
import { env } from "../config/env.js";
import { getLlmStatus, preloadLlmModel } from "../services/llm.service.js";
import { modelPreloadRequestSchema } from "../services/schema.service.js";
import { elapsedMs, nowMs } from "../utils/timer.js";

export const modelRouter = Router();

modelRouter.post("/preload", async (req, res) => {
  const request = modelPreloadRequestSchema.parse(req.body);
  const model = request.model ?? env.LLM_MODEL;
  const keepAlive = request.keepAlive ?? env.OLLAMA_KEEP_ALIVE;
  const startedAt = nowMs();

  try {
    const preload = await preloadLlmModel({ model, keepAlive });

    res.json({
      ok: true,
      provider: env.LLM_PROVIDER,
      model,
      status: preload.status,
      latencyMs: elapsedMs(startedAt)
    });
  } catch {
    res.status(500).json({
      ok: false,
      error: "MODEL_PRELOAD_FAILED",
      message: "Failed to preload model."
    });
  }
});

modelRouter.get("/status", async (_req, res) => {
  const status = await getLlmStatus();
  res.json({
    ok: status.available,
    ...status
  });
});
