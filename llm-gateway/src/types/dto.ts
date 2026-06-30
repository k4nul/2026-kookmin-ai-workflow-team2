export const DEFAULT_ALLOWED_INTENTS = [
  "SUPPORTIVE",
  "APOLOGETIC",
  "ROMANTIC",
  "BALANCED_TRUST",
  "DISMISSIVE",
  "BLAMING",
  "CONTROLLING",
  "JEALOUS",
  "INDIFFERENT",
  "DEFENSIVE",
  "UNKNOWN"
] as const;

export type ChatMessageRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatMessageRole;
  content: string;
};

export type LlmRequestPurpose =
  | "girlfriend_reply"
  | "event_reply"
  | "fallback"
  | "daily_feedback"
  | "intent_classification";

export type ChatGenerateRequest = {
  requestId?: string;
  model?: string;
  messages: ChatMessage[];
  options?: {
    temperature?: number;
    top_p?: number;
    num_predict?: number;
  };
  metadata?: {
    purpose?: LlmRequestPurpose;
    roomId?: string;
    girlfriendId?: string;
  };
};

export type ChatGenerateResponse = {
  requestId: string;
  ok: boolean;
  content: string;
  model: string;
  usage?: {
    prompt_eval_count?: number;
    eval_count?: number;
  };
  latencyMs: number;
  fallback: boolean;
  error?: string;
};

export type IntentClassifyRequest = {
  requestId?: string;
  model?: string;
  context: {
    eventId?: string;
    girlfriendMessage?: string;
    userMessage: string;
  };
  allowedIntents?: string[];
};

export type IntentClassifyResponse = {
  requestId: string;
  ok: boolean;
  intent: string;
  confidence: number;
  reason: string;
  fallback: boolean;
  error?: string;
};

export type DailyFeedbackRequest = {
  requestId?: string;
  model?: string;
  girlfriend: {
    id: string;
    displayName: string;
    personaType: string;
  };
  day: number;
  summary: {
    successfulEvents?: string[];
    failedEvents?: string[];
    timingMistakes?: string[];
    contentMistakes?: string[];
    goodBehaviors?: string[];
  };
};

export type DailyFeedbackResponse = {
  requestId: string;
  ok: boolean;
  content: string;
  model: string;
  latencyMs: number;
  fallback: boolean;
  error?: string;
};
