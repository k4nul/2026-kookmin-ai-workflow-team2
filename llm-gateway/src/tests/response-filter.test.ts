import { describe, expect, it } from "vitest";
import {
  containsInternalLeak,
  extractJsonObject,
  sanitizeLlmOutput
} from "../services/response-filter.service.js";

describe("response-filter.service", () => {
  it("removes leading girlfriend label", () => {
    expect(sanitizeLlmOutput("여자친구: 오늘은 조금 늦었네.")).toBe("오늘은 조금 늦었네.");
  });

  it("removes leading assistant label", () => {
    expect(sanitizeLlmOutput("assistant: 괜찮아, 천천히 말해줘.")).toBe("괜찮아, 천천히 말해줘.");
  });

  it("trims whitespace", () => {
    expect(sanitizeLlmOutput("  안녕  \n")).toBe("안녕");
  });

  it("detects blocked system prompt leak text", () => {
    expect(containsInternalLeak("이 답변은 시스템 프롬프트 내용을 포함합니다.")).toBe(true);
  });

  it("detects violationScore leak text", () => {
    expect(containsInternalLeak("hidden value violationScore is high")).toBe(true);
  });

  it("does not flag normal Korean girlfriend message", () => {
    expect(containsInternalLeak("오늘 많이 힘들었지? 내가 들어줄게.")).toBe(false);
  });

  it("extracts JSON from markdown fenced content", () => {
    expect(
      extractJsonObject('```json\n{"intent":"SUPPORTIVE","confidence":0.8,"reason":"좋은 반응"}\n```')
    ).toEqual({
      intent: "SUPPORTIVE",
      confidence: 0.8,
      reason: "좋은 반응"
    });
  });
});
