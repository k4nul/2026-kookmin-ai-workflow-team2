import { describe, expect, it } from "vitest";
import { env } from "../config/env.js";
import { chatGenerateRequestSchema } from "../services/schema.service.js";
import { getTotalMessageContentLength } from "../utils/text.js";

describe("chat request validation", () => {
  it("total message length utility respects LLM_MAX_INPUT_CHARS", () => {
    const messages = [{ role: "user" as const, content: "a".repeat(env.LLM_MAX_INPUT_CHARS) }];
    expect(getTotalMessageContentLength(messages)).toBe(env.LLM_MAX_INPUT_CHARS);
  });

  it("fails when total message length exceeds LLM_MAX_INPUT_CHARS", () => {
    expect(
      chatGenerateRequestSchema.safeParse({
        messages: [{ role: "user", content: "a".repeat(env.LLM_MAX_INPUT_CHARS + 1) }]
      }).success
    ).toBe(false);
  });

  it("fails empty messages array", () => {
    expect(chatGenerateRequestSchema.safeParse({ messages: [] }).success).toBe(false);
  });

  it("passes valid metadata purpose", () => {
    expect(
      chatGenerateRequestSchema.safeParse({
        messages: [{ role: "user", content: "안녕" }],
        metadata: {
          purpose: "girlfriend_reply"
        }
      }).success
    ).toBe(true);
  });

  it("fails invalid metadata purpose", () => {
    expect(
      chatGenerateRequestSchema.safeParse({
        messages: [{ role: "user", content: "안녕" }],
        metadata: {
          purpose: "score_calculation"
        }
      }).success
    ).toBe(false);
  });
});
