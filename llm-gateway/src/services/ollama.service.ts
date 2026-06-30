import { env } from "../config/env.js";
import type {
  OllamaChatOptions,
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaRunningModelsResponse,
  OllamaTagsResponse,
  OllamaVersionResponse
} from "../types/ollama.js";
import type { ChatMessage } from "../types/dto.js";
import { createAbortControllerWithTimeout } from "../utils/timeout.js";

type OllamaErrorCode = "OLLAMA_TIMEOUT" | "OLLAMA_HTTP_ERROR" | "OLLAMA_NETWORK_ERROR";

export class OllamaServiceError extends Error {
  readonly code: OllamaErrorCode;
  readonly status?: number;

  constructor(code: OllamaErrorCode, message: string, status?: number) {
    super(message);
    this.name = "OllamaServiceError";
    this.code = code;
    this.status = status;
  }
}

export async function callOllamaChat(input: {
  model: string;
  messages: ChatMessage[];
  options?: OllamaChatOptions;
  format?: "json";
  keepAlive?: string;
  timeoutMs?: number;
}): Promise<OllamaChatResponse> {
  const body: OllamaChatRequest = {
    model: input.model,
    messages: input.messages,
    stream: false,
    keep_alive: input.keepAlive ?? env.OLLAMA_KEEP_ALIVE,
    options: input.options,
    format: input.format
  };

  return fetchOllamaJson<OllamaChatResponse>("/api/chat", {
    method: "POST",
    body,
    timeoutMs: input.timeoutMs
  });
}

export async function getOllamaVersion(): Promise<OllamaVersionResponse> {
  return fetchOllamaJson<OllamaVersionResponse>("/api/version");
}

export async function getOllamaTags(): Promise<OllamaTagsResponse> {
  return fetchOllamaJson<OllamaTagsResponse>("/api/tags");
}

export async function getOllamaRunningModels(): Promise<OllamaRunningModelsResponse> {
  return fetchOllamaJson<OllamaRunningModelsResponse>("/api/ps");
}

export function isModelAvailable(tags: OllamaTagsResponse, model: string): boolean {
  return tags.models?.some((entry) => isSameModel(entry.name, model) || isSameModel(entry.model, model)) ?? false;
}

export function isModelLoaded(runningModels: OllamaRunningModelsResponse, model: string): boolean {
  return (
    runningModels.models?.some((entry) => isSameModel(entry.name, model) || isSameModel(entry.model, model)) ??
    false
  );
}

export async function preloadModel(input: {
  model?: string;
  keepAlive?: string;
  timeoutMs?: number;
} = {}): Promise<OllamaChatResponse> {
  return callOllamaChat({
    model: input.model ?? env.LLM_MODEL,
    messages: [{ role: "user", content: "" }],
    keepAlive: input.keepAlive ?? env.OLLAMA_KEEP_ALIVE,
    timeoutMs: input.timeoutMs
  });
}

async function fetchOllamaJson<T>(
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: unknown;
    timeoutMs?: number;
  } = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? env.LLM_TIMEOUT_MS;
  const { controller, clear } = createAbortControllerWithTimeout(timeoutMs);

  try {
    const response = await fetch(`${env.OLLAMA_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers: options.body ? { "content-type": "application/json" } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new OllamaServiceError(
        "OLLAMA_HTTP_ERROR",
        `Ollama returned HTTP ${response.status}.`,
        response.status
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof OllamaServiceError) {
      throw error;
    }

    if (controller.signal.aborted) {
      throw new OllamaServiceError("OLLAMA_TIMEOUT", `Ollama request timed out after ${timeoutMs}ms.`);
    }

    throw new OllamaServiceError("OLLAMA_NETWORK_ERROR", "Failed to reach Ollama.");
  } finally {
    clear();
  }
}

function isSameModel(candidate: string | undefined, model: string): boolean {
  if (!candidate) {
    return false;
  }

  return candidate === model || candidate.startsWith(`${model}:`);
}
