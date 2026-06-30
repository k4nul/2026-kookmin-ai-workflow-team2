import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8081),
  DATABASE_PATH: z.string().default("./data/app.sqlite"),
  LLM_GATEWAY_BASE_URL: z.string().url().default("http://localhost:8082"),
  LLM_GATEWAY_API_KEY: z.string().default("dev-internal-key"),
  LLM_GATEWAY_MODEL: z.string().min(1).default("gpt5.3-spark"),
  DEFAULT_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(3600),
  FAST_MODE_MESSAGES_PER_DAY: z.coerce.number().int().positive().default(20),
  FAST_MODE_USER_TURNS_PER_DAY: z.coerce.number().int().positive().default(10),
  DEBUG_EXPOSE_SCORES: z
    .string()
    .default("false")
    .transform((value) => value.toLowerCase() === "true")
});

export const env = envSchema.parse(process.env);
