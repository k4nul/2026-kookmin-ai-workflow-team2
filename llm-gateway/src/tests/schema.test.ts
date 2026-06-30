import { describe, expect, it } from "vitest";
import {
  chatGenerateRequestSchema,
  dailyFeedbackRequestSchema,
  intentClassifyRequestSchema
} from "../services/schema.service.js";

describe("schema.service", () => {
  it("passes valid ChatGenerateRequest", () => {
    expect(
      chatGenerateRequestSchema.safeParse({
        messages: [{ role: "user", content: "안녕" }]
      }).success
    ).toBe(true);
  });

  it("fails when messages are missing", () => {
    expect(chatGenerateRequestSchema.safeParse({}).success).toBe(false);
  });

  it("fails when message role is invalid", () => {
    expect(
      chatGenerateRequestSchema.safeParse({
        messages: [{ role: "developer", content: "안녕" }]
      }).success
    ).toBe(false);
  });

  it("passes valid IntentClassifyRequest", () => {
    expect(
      intentClassifyRequestSchema.safeParse({
        context: {
          userMessage: "오늘 많이 힘들었겠다. 내가 들어줄게."
        }
      }).success
    ).toBe(true);
  });

  it("passes valid DailyFeedbackRequest", () => {
    expect(
      dailyFeedbackRequestSchema.safeParse({
        girlfriend: {
          id: "gf_seoa",
          displayName: "서아",
          personaType: "CONTEXT_READER"
        },
        day: 3,
        summary: {
          successfulEvents: ["parents_fight"]
        }
      }).success
    ).toBe(true);
  });

  it("fails invalid DailyFeedbackRequest", () => {
    expect(
      dailyFeedbackRequestSchema.safeParse({
        day: 0,
        summary: {}
      }).success
    ).toBe(false);
  });
});
