import { Router } from "express";
import {
  getLlmProviderStatus,
  preloadLlmModel,
  resolveLlmModel
} from "../services/llm-provider.service.js";
import {
  modelPreloadRequestSchema,
  type ModelPreloadRequestInput
} from "../services/schema.service.js";
import { elapsedMs, nowMs } from "../utils/timer.js";

export const modelRouter = Router();

modelRouter.post("/preload", async (req, res, next) => {
  let request: ModelPreloadRequestInput;
  try {
    request = modelPreloadRequestSchema.parse(req.body);
  } catch (error) {
    next(error);
    return;
  }

  const model = resolveLlmModel(request.model);
  const startedAt = nowMs();

  try {
    await preloadLlmModel({ model, keepAlive: request.keepAlive });

    res.json({
      ok: true,
      model,
      status: "preloaded",
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
  const status = await getLlmProviderStatus();

  res.json({
    ok: status.ok,
    provider: status.provider,
    model: status.model,
    available: status.available,
    loaded: status.loaded,
    version: status.version,
    error: status.error
  });
});
