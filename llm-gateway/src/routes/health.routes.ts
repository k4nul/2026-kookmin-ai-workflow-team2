import { Router } from "express";
import { env } from "../config/env.js";
import { getLlmProviderStatus } from "../services/llm-provider.service.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  const status = await getLlmProviderStatus();

  res.json({
    ok: true,
    service: "llm-gateway",
    port: env.PORT,
    provider: status.provider,
    llm: {
      connected: status.ok,
      model: status.model,
      available: status.available,
      loaded: status.loaded,
      version: status.version,
      error: status.error
    },
    ollama: {
      baseUrl: env.OLLAMA_BASE_URL,
      connected: status.provider === "ollama" && status.ok,
      model: env.OLLAMA_MODEL,
      modelAvailable: status.provider === "ollama" && status.available
    },
    codexCli:
      status.provider === "codex-cli"
        ? {
            command: env.CODEX_CLI_COMMAND,
            connected: status.ok,
            model: status.model,
            version: status.version,
            error: status.error
          }
        : undefined
  });
});
