import { Router } from "express";
import { env } from "../config/env.js";
import { getLlmStatus } from "../services/llm.service.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  const llm = await getLlmStatus();

  res.json({
    ok: true,
    service: "llm-gateway",
    port: env.PORT,
    llm
  });
});
