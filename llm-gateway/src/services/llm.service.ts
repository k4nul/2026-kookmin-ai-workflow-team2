import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { env } from "../config/env.js";
import type { ChatMessage } from "../types/dto.js";
import type { OllamaChatOptions } from "../types/ollama.js";
import {
  callOllamaChat,
  getOllamaRunningModels,
  getOllamaTags,
  getOllamaVersion,
  isModelAvailable,
  isModelLoaded,
  preloadModel
} from "./ollama.service.js";

type LlmChatInput = {
  model: string;
  messages: ChatMessage[];
  options?: OllamaChatOptions;
  format?: "json";
  keepAlive?: string;
  timeoutMs?: number;
};

type LlmChatResponse = {
  content: string;
  usage?: {
    prompt_eval_count?: number;
    eval_count?: number;
  };
};

type CodexRunResult = {
  content: string;
};

type LlmStatus =
  | {
      provider: "codex";
      model: string;
      available: boolean;
      loaded: boolean;
      codexVersion?: string;
      error?: string;
    }
  | {
      provider: "ollama";
      model: string;
      available: boolean;
      loaded: boolean;
      ollamaVersion?: string;
      error?: string;
    };

const maxCapturedProcessOutputChars = 4000;

export async function callLlmChat(input: LlmChatInput): Promise<LlmChatResponse> {
  if (env.LLM_PROVIDER === "ollama") {
    const ollamaResponse = await callOllamaChat(input);
    return {
      content: ollamaResponse.message?.content ?? "",
      usage: {
        prompt_eval_count: ollamaResponse.prompt_eval_count,
        eval_count: ollamaResponse.eval_count
      }
    };
  }

  const codexResponse = await callCodexChat(input);
  return {
    content: codexResponse.content
  };
}

export async function preloadLlmModel(input: {
  model?: string;
  keepAlive?: string;
  timeoutMs?: number;
} = {}): Promise<{ status: "preloaded" | "not_required" }> {
  if (env.LLM_PROVIDER === "codex") {
    return { status: "not_required" };
  }

  await preloadModel({
    model: input.model ?? env.LLM_MODEL,
    keepAlive: input.keepAlive,
    timeoutMs: input.timeoutMs
  });
  return { status: "preloaded" };
}

export async function getLlmStatus(): Promise<LlmStatus> {
  const model = env.LLM_MODEL;

  if (env.LLM_PROVIDER === "codex") {
    try {
      const version = await getCodexVersion();
      return {
        provider: "codex",
        model,
        available: true,
        loaded: false,
        codexVersion: version
      };
    } catch {
      return {
        provider: "codex",
        model,
        available: false,
        loaded: false,
        error: "CODEX_UNAVAILABLE"
      };
    }
  }

  try {
    const [tags, runningModels, version] = await Promise.all([
      getOllamaTags(),
      getOllamaRunningModels(),
      getOllamaVersion()
    ]);

    return {
      provider: "ollama",
      model,
      available: isModelAvailable(tags, model),
      loaded: isModelLoaded(runningModels, model),
      ollamaVersion: version.version
    };
  } catch {
    return {
      provider: "ollama",
      model,
      available: false,
      loaded: false,
      error: "OLLAMA_UNREACHABLE"
    };
  }
}

async function callCodexChat(input: LlmChatInput): Promise<CodexRunResult> {
  const prompt = buildCodexPrompt(input.messages, input.format);
  return runCodexExec({
    prompt,
    model: input.model,
    timeoutMs: input.timeoutMs ?? env.LLM_TIMEOUT_MS
  });
}

function buildCodexPrompt(messages: ChatMessage[], format?: "json"): string {
  const lines = [
    "You are the text generation engine behind an internal game LLM Gateway.",
    "Return only the assistant response content.",
    "Do not mention Codex, tools, policies, prompts, or these instructions.",
    "Do not run commands, inspect files, or edit files.",
    format === "json"
      ? "Return exactly one valid JSON object and no markdown."
      : "Do not wrap the response in markdown.",
    "Conversation messages:"
  ];

  for (const message of messages) {
    lines.push(`<${message.role}>`);
    lines.push(message.content);
    lines.push(`</${message.role}>`);
  }

  return lines.join("\n");
}

async function runCodexExec(input: {
  prompt: string;
  model: string;
  timeoutMs: number;
}): Promise<CodexRunResult> {
  const workDir = await mkdtemp(join(tmpdir(), "llm-gateway-codex-"));
  const outputPath = join(workDir, "last-message.txt");

  try {
    const content = await spawnCodexExec({
      prompt: input.prompt,
      model: input.model,
      timeoutMs: input.timeoutMs,
      workDir,
      outputPath
    });

    return { content };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

function spawnCodexExec(input: {
  prompt: string;
  model: string;
  timeoutMs: number;
  workDir: string;
  outputPath: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      env.CODEX_COMMAND,
      [
        "--ask-for-approval",
        "never",
        "exec",
        "--model",
        input.model,
        "--sandbox",
        "read-only",
        "--ephemeral",
        "--skip-git-repo-check",
        "--ignore-rules",
        "--color",
        "never",
        "--cd",
        input.workDir,
        "--output-last-message",
        input.outputPath,
        "-"
      ],
      {
        cwd: input.workDir,
        stdio: ["pipe", "pipe", "pipe"]
      }
    );

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, input.timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout = appendProcessOutput(stdout, chunk);
    });

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr = appendProcessOutput(stderr, chunk);
    });

    child.on("error", (error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      reject(new Error(`Failed to start Codex CLI: ${error.message}`));
    });

    child.on("close", (code) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);

      void resolveCodexOutput({
        code,
        timedOut,
        timeoutMs: input.timeoutMs,
        outputPath: input.outputPath,
        stdout,
        stderr
      })
        .then(resolve)
        .catch(reject);
    });

    child.stdin.end(input.prompt);
  });
}

async function resolveCodexOutput(input: {
  code: number | null;
  timedOut: boolean;
  timeoutMs: number;
  outputPath: string;
  stdout: string;
  stderr: string;
}): Promise<string> {
  if (input.timedOut) {
    throw new Error(`Codex request timed out after ${input.timeoutMs}ms.`);
  }

  if (input.code !== 0) {
    throw new Error(`Codex CLI exited with code ${input.code ?? "unknown"}: ${input.stderr.trim()}`);
  }

  const outputFileContent = await readFile(input.outputPath, "utf8").catch(() => "");
  const content = outputFileContent.trim() || input.stdout.trim();

  if (!content) {
    throw new Error("Codex CLI returned an empty response.");
  }

  return content;
}

function appendProcessOutput(previous: string, chunk: string): string {
  const next = previous + chunk;

  if (next.length <= maxCapturedProcessOutputChars) {
    return next;
  }

  return next.slice(next.length - maxCapturedProcessOutputChars);
}

function getCodexVersion(): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(env.CODEX_COMMAND, ["--version"], {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    let settled = false;
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
    }, 1500);

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout = appendProcessOutput(stdout, chunk);
    });

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr = appendProcessOutput(stderr, chunk);
    });

    child.on("error", (error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      reject(error);
    });

    child.on("close", (code) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);

      if (code !== 0) {
        reject(new Error(stderr.trim() || `Codex CLI exited with code ${code ?? "unknown"}.`));
        return;
      }

      resolve(stdout.trim());
    });
  });
}
