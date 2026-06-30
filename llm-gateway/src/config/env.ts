import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8082),
  INTERNAL_API_KEY: z.string().min(1).default("dev-internal-key"),
  LLM_PROVIDER: z.enum(["codex", "ollama"]).default("codex"),
  LLM_MODEL: z.string().min(1).optional(),
  CODEX_COMMAND: z.string().min(1).default("codex"),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().min(1).optional(),
  OLLAMA_KEEP_ALIVE: z.string().min(1).default("30m"),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  LLM_MAX_INPUT_CHARS: z.coerce.number().int().positive().default(12000),
  LLM_MAX_OUTPUT_CHARS: z.coerce.number().int().positive().default(800),
  NODE_ENV: z.string().default("development")
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  LLM_MODEL:
    parsedEnv.LLM_MODEL ??
    (parsedEnv.LLM_PROVIDER === "ollama" ? parsedEnv.OLLAMA_MODEL ?? "llama3.2" : "gpt5.3-spark")
};

export const isDevelopment = env.NODE_ENV === "development";
