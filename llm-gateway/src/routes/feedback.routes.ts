import { Router } from "express";
import { getDailyFeedbackFallback } from "../services/fallback.service.js";
import { callLlmChat, resolveLlmModel } from "../services/llm-provider.service.js";
import { buildDailyFeedbackMessages } from "../services/prompt-template.service.js";
import {
  containsInternalLeak,
  sanitizeLlmOutput
} from "../services/response-filter.service.js";
import {
  dailyFeedbackRequestSchema,
  type DailyFeedbackRequestInput
} from "../services/schema.service.js";
import { ensureRequestId } from "../utils/request-id.js";
import { elapsedMs, nowMs } from "../utils/timer.js";

const defaultDailyFeedbackOptions = {
  temperature: 0.5,
  top_p: 0.9,
  num_predict: 220
};

export const feedbackRouter = Router();

feedbackRouter.post("/daily", async (req, res, next) => {
  let request: DailyFeedbackRequestInput;
  try {
    request = dailyFeedbackRequestSchema.parse(req.body);
  } catch (error) {
    next(error);
    return;
  }

  const requestId = ensureRequestId(request.requestId);
  const model = resolveLlmModel(request.model);
  const startedAt = nowMs();
  const messages = buildDailyFeedbackMessages(request);

  try {
    const llmResponse = await callLlmChat({
      model,
      messages,
      options: defaultDailyFeedbackOptions
    });
    const content = sanitizeLlmOutput(llmResponse.message?.content ?? "");
    const shouldFallback = !content || containsInternalLeak(content);
    const latencyMs = elapsedMs(startedAt);

    if (shouldFallback) {
      console.log(JSON.stringify({ requestId, route: "POST /v1/feedback/daily", latencyMs, fallback: true }));
      res.json({
        requestId,
        ok: true,
        content: getDailyFeedbackFallback(),
        model,
        latencyMs,
        fallback: true,
        error: "DAILY_FEEDBACK_FAILED"
      });
      return;
    }

    console.log(JSON.stringify({ requestId, route: "POST /v1/feedback/daily", latencyMs, fallback: false }));
    res.json({
      requestId,
      ok: true,
      content,
      model,
      latencyMs,
      fallback: false
    });
  } catch {
    const latencyMs = elapsedMs(startedAt);
    console.log(JSON.stringify({ requestId, route: "POST /v1/feedback/daily", latencyMs, fallback: true }));
    res.json({
      requestId,
      ok: true,
      content: getDailyFeedbackFallback(),
      model,
      latencyMs,
      fallback: true,
      error: "DAILY_FEEDBACK_FAILED"
    });
  }
});
