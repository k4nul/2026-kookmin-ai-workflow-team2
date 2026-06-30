import { z, type ZodIssue } from "zod";
import { env } from "../config/env.js";
import { DEFAULT_ALLOWED_INTENTS } from "../types/dto.js";
import { getTotalMessageContentLength } from "../utils/text.js";

const chatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string()
});

const llmOptionsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  num_predict: z.number().int().positive().optional()
});

const metadataPurposeSchema = z.enum([
  "girlfriend_reply",
  "event_reply",
  "fallback",
  "daily_feedback",
  "intent_classification"
]);

export const chatGenerateRequestSchema = z
  .object({
    requestId: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    messages: z.array(chatMessageSchema).nonempty(),
    options: llmOptionsSchema.optional(),
    metadata: z
      .object({
        purpose: metadataPurposeSchema.optional(),
        roomId: z.string().optional(),
        girlfriendId: z.string().optional()
      })
      .optional()
  })
  .superRefine((request, ctx) => {
    if (getTotalMessageContentLength(request.messages) > env.LLM_MAX_INPUT_CHARS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["messages"],
        message: `Total message content length must be <= ${env.LLM_MAX_INPUT_CHARS}.`
      });
    }
  });

export const intentClassifyRequestSchema = z.object({
  requestId: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  context: z.object({
    eventId: z.string().optional(),
    girlfriendMessage: z.string().optional(),
    userMessage: z.string().min(1)
  }),
  allowedIntents: z.array(z.string().min(1)).nonempty().optional()
});

export const dailyFeedbackRequestSchema = z.object({
  requestId: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  girlfriend: z.object({
    id: z.string().min(1),
    displayName: z.string().min(1),
    personaType: z.string().min(1)
  }),
  day: z.number().int().positive(),
  summary: z.object({
    successfulEvents: z.array(z.string()).optional(),
    failedEvents: z.array(z.string()).optional(),
    timingMistakes: z.array(z.string()).optional(),
    contentMistakes: z.array(z.string()).optional(),
    goodBehaviors: z.array(z.string()).optional()
  })
});

export const modelPreloadRequestSchema = z.object({
  model: z.string().min(1).optional(),
  keepAlive: z.string().min(1).optional()
});

const intentClassificationOutputSchema = z.object({
  intent: z.string().min(1),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1)
});

export function parseIntentClassificationOutput(
  value: unknown,
  allowedIntents: string[]
): {
  intent: string;
  confidence: number;
  reason: string;
} | null {
  const parsed = intentClassificationOutputSchema.safeParse(value);

  if (!parsed.success || !allowedIntents.includes(parsed.data.intent)) {
    return null;
  }

  return parsed.data;
}

export function getAllowedIntents(allowedIntents?: string[]): string[] {
  return allowedIntents?.length ? allowedIntents : [...DEFAULT_ALLOWED_INTENTS];
}

export function formatZodIssues(issues: ZodIssue[]): Array<{
  path: string;
  message: string;
}> {
  return issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message
  }));
}

export type ChatGenerateRequestInput = z.infer<typeof chatGenerateRequestSchema>;
export type IntentClassifyRequestInput = z.infer<typeof intentClassifyRequestSchema>;
export type DailyFeedbackRequestInput = z.infer<typeof dailyFeedbackRequestSchema>;
export type ModelPreloadRequestInput = z.infer<typeof modelPreloadRequestSchema>;
