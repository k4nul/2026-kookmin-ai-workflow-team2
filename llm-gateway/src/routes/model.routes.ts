import { Router } from "express";
import { env } from "../config/env.js";
import {
  getOllamaRunningModels,
  getOllamaTags,
  getOllamaVersion,
  isModelAvailable,
  isModelLoaded,
  preloadModel
} from "../services/ollama.service.js";
import { modelPreloadRequestSchema } from "../services/schema.service.js";
import { elapsedMs, nowMs } from "../utils/timer.js";

export const modelRouter = Router();

modelRouter.post("/preload", async (req, res) => {
  const request = modelPreloadRequestSchema.parse(req.body);
  const model = request.model ?? env.OLLAMA_MODEL;
  const keepAlive = request.keepAlive ?? env.OLLAMA_KEEP_ALIVE;
  const startedAt = nowMs();

  try {
    await preloadModel({ model, keepAlive });

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
  const model = env.OLLAMA_MODEL;

  try {
    const [tags, runningModels, version] = await Promise.all([
      getOllamaTags(),
      getOllamaRunningModels(),
      getOllamaVersion()
    ]);

    res.json({
      ok: true,
      model,
      available: isModelAvailable(tags, model),
      loaded: isModelLoaded(runningModels, model),
      ollamaVersion: version.version
    });
  } catch {
    res.json({
      ok: false,
      model,
      available: false,
      loaded: false,
      error: "OLLAMA_UNREACHABLE"
    });
  }
});
