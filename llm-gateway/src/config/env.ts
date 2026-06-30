import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8080),
  INTERNAL_API_KEY: z.string().min(1).default("dev-internal-key"),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().min(1).default("llama3.2"),
  OLLAMA_KEEP_ALIVE: z.string().min(1).default("30m"),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  LLM_MAX_INPUT_CHARS: z.coerce.number().int().positive().default(12000),
  LLM_MAX_OUTPUT_CHARS: z.coerce.number().int().positive().default(800),
  NODE_ENV: z.string().default("development")
});

export const env = envSchema.parse(process.env);

export const isDevelopment = env.NODE_ENV === "development";
