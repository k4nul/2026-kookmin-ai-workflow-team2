import { env } from "../config/env.js";
import type { ChatMessage } from "../types/dto.js";
import type { OllamaChatOptions, OllamaChatResponse } from "../types/ollama.js";
import {
  callCodexCliChat,
  getCodexCliModelName,
  getCodexCliStatus
} from "./codex-cli.service.js";
import {
  callOllamaChat,
  getOllamaRunningModels,
  getOllamaTags,
  getOllamaVersion,
  isModelAvailable,
  isModelLoaded,
  preloadModel
} from "./ollama.service.js";

export type LlmProvider = "ollama" | "codex-cli";

export type LlmProviderStatus = {
  ok: boolean;
  provider: LlmProvider;
  model: string;
  available: boolean;
  loaded: boolean;
  version?: string;
  error?: string;
};

export function getLlmProvider(): LlmProvider {
  return env.LLM_PROVIDER;
}

export function resolveLlmModel(requestedModel?: string): string {
  if (env.LLM_PROVIDER === "codex-cli") {
    return getCodexCliModelName();
  }

  return requestedModel ?? env.OLLAMA_MODEL;
}

export async function callLlmChat(input: {
  model?: string;
  messages: ChatMessage[];
  options?: OllamaChatOptions;
  format?: "json";
  keepAlive?: string;
  timeoutMs?: number;
}): Promise<OllamaChatResponse> {
  if (env.LLM_PROVIDER === "codex-cli") {
    return callCodexCliChat({
      model: env.CODEX_CLI_MODEL,
      messages: input.messages,
      options: input.options,
      format: input.format,
      timeoutMs: input.timeoutMs
    });
  }

  return callOllamaChat({
    model: input.model ?? env.OLLAMA_MODEL,
    messages: input.messages,
    options: input.options,
    format: input.format,
    keepAlive: input.keepAlive,
    timeoutMs: input.timeoutMs
  });
}

export async function preloadLlmModel(input: {
  model?: string;
  keepAlive?: string;
  timeoutMs?: number;
} = {}): Promise<void> {
  if (env.LLM_PROVIDER === "codex-cli") {
    const status = await getCodexCliStatus(Math.min(input.timeoutMs ?? env.CODEX_CLI_TIMEOUT_MS, 5000));
    if (!status.available) {
      throw new Error(status.error ?? "Codex CLI is unavailable.");
    }
    return;
  }

  await preloadModel({
    model: input.model ?? env.OLLAMA_MODEL,
    keepAlive: input.keepAlive ?? env.OLLAMA_KEEP_ALIVE,
    timeoutMs: input.timeoutMs
  });
}

export async function getLlmProviderStatus(): Promise<LlmProviderStatus> {
  if (env.LLM_PROVIDER === "codex-cli") {
    const status = await getCodexCliStatus();
    return {
      ok: status.available,
      provider: "codex-cli",
      model: getCodexCliModelName(),
      available: status.available,
      loaded: status.available,
      version: status.version,
      error: status.available ? undefined : "CODEX_CLI_UNAVAILABLE"
    };
  }

  const model = env.OLLAMA_MODEL;

  try {
    const [tags, runningModels, version] = await Promise.all([
      getOllamaTags(),
      getOllamaRunningModels(),
      getOllamaVersion()
    ]);

    return {
      ok: true,
      provider: "ollama",
      model,
      available: isModelAvailable(tags, model),
      loaded: isModelLoaded(runningModels, model),
      version: version.version
    };
  } catch {
    return {
      ok: false,
      provider: "ollama",
      model,
      available: false,
      loaded: false,
      error: "OLLAMA_UNREACHABLE"
    };
  }
}
