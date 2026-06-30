import { Router } from "express";
import { getIntentFallback } from "../services/fallback.service.js";
import { callLlmChat, resolveLlmModel } from "../services/llm-provider.service.js";
import { buildIntentClassificationMessages } from "../services/prompt-template.service.js";
import { extractJsonObject, sanitizeLlmOutput } from "../services/response-filter.service.js";
import {
  getAllowedIntents,
  intentClassifyRequestSchema,
  parseIntentClassificationOutput,
  type IntentClassifyRequestInput
} from "../services/schema.service.js";
import { ensureRequestId } from "../utils/request-id.js";

const defaultIntentOptions = {
  temperature: 0.1,
  top_p: 0.9,
  num_predict: 160
};

export const classifyRouter = Router();

classifyRouter.post("/intent", async (req, res, next) => {
  let request: IntentClassifyRequestInput;
  try {
    request = intentClassifyRequestSchema.parse(req.body);
  } catch (error) {
    next(error);
    return;
  }

  const requestId = ensureRequestId(request.requestId);
  const model = resolveLlmModel(request.model);
  const allowedIntents = getAllowedIntents(request.allowedIntents);
  const messages = buildIntentClassificationMessages(request, allowedIntents);

  try {
    const llmResponse = await callLlmChat({
      model,
      messages,
      options: defaultIntentOptions,
      format: "json"
    });
    const rawContent = sanitizeLlmOutput(llmResponse.message?.content ?? "");
    const parsedJson = extractJsonObject(rawContent);
    const classification = parseIntentClassificationOutput(parsedJson, allowedIntents);

    if (!classification) {
      throw new Error("Invalid intent classification output.");
    }

    console.log(JSON.stringify({ requestId, route: "POST /v1/classify/intent", fallback: false }));
    res.json({
      requestId,
      ok: true,
      intent: classification.intent,
      confidence: classification.confidence,
      reason: sanitizeLlmOutput(classification.reason),
      fallback: false
    });
  } catch {
    const fallback = getIntentFallback();
    console.log(JSON.stringify({ requestId, route: "POST /v1/classify/intent", fallback: true }));
    res.json({
      requestId,
      ok: true,
      ...fallback,
      fallback: true,
      error: "INTENT_CLASSIFICATION_FAILED"
    });
  }
});
