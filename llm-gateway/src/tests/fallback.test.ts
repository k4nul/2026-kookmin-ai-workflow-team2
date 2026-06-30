import { describe, expect, it } from "vitest";
import {
  getDailyFeedbackFallback,
  getGirlfriendFallbackReply,
  getIntentFallback
} from "../services/fallback.service.js";

describe("fallback.service", () => {
  it("returns gf_minseo fallback", () => {
    expect(getGirlfriendFallbackReply("gf_minseo")).toBe("지금 뭐라고 해야 할지 모르겠어.");
  });

  it("returns gf_jiyoon fallback", () => {
    expect(getGirlfriendFallbackReply("gf_jiyoon")).toBe("잠깐 생각 좀 할게.");
  });

  it("returns gf_seoa fallback", () => {
    expect(getGirlfriendFallbackReply("gf_seoa")).toBe("지금은 말이 잘 안 나와.");
  });

  it("returns gf_harin fallback", () => {
    expect(getGirlfriendFallbackReply("gf_harin")).toBe("얘기하기엔 조금 힘들다. 다시 얘기하자.");
  });

  it("returns default fallback", () => {
    expect(getGirlfriendFallbackReply("unknown")).toBe("잠깐만, 지금은 바로 답하기 어렵겠어.");
  });

  it("returns daily feedback fallback", () => {
    expect(getDailyFeedbackFallback()).toContain("오늘의 피드백");
  });

  it("returns intent fallback", () => {
    expect(getIntentFallback()).toEqual({
      intent: "UNKNOWN",
      confidence: 0,
      reason: "분류에 실패했습니다."
    });
  });
});
