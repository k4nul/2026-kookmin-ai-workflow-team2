import { Router } from "express";
import { isDevelopment } from "../config/env.js";
import {
  containsInternalLeak,
  sanitizeLlmOutput
} from "../services/response-filter.service.js";
import { getGirlfriendFallbackReply } from "../services/fallback.service.js";
import { callLlmChat, resolveLlmModel } from "../services/llm-provider.service.js";
import {
  chatGenerateRequestSchema,
  type ChatGenerateRequestInput
} from "../services/schema.service.js";
import { ensureRequestId } from "../utils/request-id.js";
import { elapsedMs, nowMs } from "../utils/timer.js";
import { getTotalMessageContentLength } from "../utils/text.js";
import type { ChatMessage } from "../types/dto.js";

const defaultChatOptions = {
  temperature: 0.75,
  top_p: 0.9,
  num_predict: 120
};

export const chatRouter = Router();

chatRouter.post("/generate", async (req, res, next) => {
  let request: ChatGenerateRequestInput;
  try {
    request = chatGenerateRequestSchema.parse(req.body);
  } catch (error) {
    next(error);
    return;
  }

  const requestId = ensureRequestId(request.requestId);
  const model = resolveLlmModel(request.model);
  const startedAt = nowMs();

  try {
    const llmResponse = await callLlmChat({
      model,
      messages: request.messages,
      options: {
        ...defaultChatOptions,
        ...request.options
      }
    });
    const content = sanitizeLlmOutput(llmResponse.message?.content ?? "");
    const shouldFallback = !content || containsInternalLeak(content);
    const latencyMs = elapsedMs(startedAt);

    if (shouldFallback) {
      const fallbackContent = getGirlfriendFallbackReply(request.metadata?.girlfriendId);
      logRoute("POST /v1/chat/generate", requestId, latencyMs, true, request.messages);
      res.json({
        requestId,
        ok: true,
        content: fallbackContent,
        model,
        latencyMs,
        fallback: true,
        error: "LLM_OUTPUT_FILTERED"
      });
      return;
    }

    logRoute("POST /v1/chat/generate", requestId, latencyMs, false, request.messages);
    res.json({
      requestId,
      ok: true,
      content,
      model,
      usage: {
        prompt_eval_count: llmResponse.prompt_eval_count,
        eval_count: llmResponse.eval_count
      },
      latencyMs,
      fallback: false
    });
  } catch {
    const latencyMs = elapsedMs(startedAt);
    logRoute("POST /v1/chat/generate", requestId, latencyMs, true, request.messages);
    res.json({
      requestId,
      ok: true,
      content: getGirlfriendFallbackReply(request.metadata?.girlfriendId),
      model,
      latencyMs,
      fallback: true,
      error: "LLM_GENERATION_FAILED"
    });
  }
});

function logRoute(
  route: string,
  requestId: string,
  latencyMs: number,
  fallback: boolean,
  messages: ChatMessage[]
): void {
  const payload: Record<string, unknown> = {
    requestId,
    route,
    latencyMs,
    fallback
  };

  if (isDevelopment) {
    payload.promptLength = getTotalMessageContentLength(messages);
  }

  console.log(JSON.stringify(payload));
}
