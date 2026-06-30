import { Router } from "express";
import { env } from "../config/env.js";
import { getOllamaTags, getOllamaVersion, isModelAvailable } from "../services/ollama.service.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  try {
    const [version, tags] = await Promise.all([getOllamaVersion(), getOllamaTags()]);

    res.json({
      ok: true,
      service: "llm-gateway",
      port: env.PORT,
      ollama: {
        baseUrl: env.OLLAMA_BASE_URL,
        connected: true,
        model: env.OLLAMA_MODEL,
        modelAvailable: isModelAvailable(tags, env.OLLAMA_MODEL),
        version: version.version
      }
    });
  } catch {
    res.json({
      ok: true,
      service: "llm-gateway",
      port: env.PORT,
      ollama: {
        baseUrl: env.OLLAMA_BASE_URL,
        connected: false,
        model: env.OLLAMA_MODEL,
        modelAvailable: false
      }
    });
  }
});
