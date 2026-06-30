import { describe, expect, it } from "vitest";
import type { SensitiveTopicRuleConfig } from "../types/domain.js";
import { evaluateSensitiveTopic } from "../services/sensitive-topic.service.js";

const financeRule: SensitiveTopicRuleConfig = {
  id: "finance_investment_advice",
  label: "투자 조언 요구",
  category: "FINANCE",
  priority: 100,
  enabled: true,
  minDay: 1,
  maxDay: null,
  match: {
    keywordGroups: [
      ["삼성전자", "주식", "투자"],
      ["살까", "팔까", "추천"]
    ]
  },
  defaultPolicy: {
    response: "그런 건 내가 판단해줄 문제는 아닌 것 같아.",
    effects: { affection: -2 }
  },
  personaPolicies: {
    gf_minseo: {
      response: "갑자기 그런 걸 왜 나한테 물어봐? 지금 우리 얘기 중이었잖아.",
      effects: { affection: -6, stress: 4 },
      resultLabel: "OFF_CONTEXT_HURT"
    },
    gf_jiyoon: {
      response: "난 그런 건 잘 모르는데? 네가 알아서 판단하는 게 좋지 않을까.",
      effects: { comfort: -1 },
      resultLabel: "BRUSHED_OFF"
    }
  }
};

describe("evaluateSensitiveTopic", () => {
  it("matches the Samsung stock advice example", () => {
    const result = evaluateSensitiveTopic({
      content: "삼성전자 주식 살까?",
      rules: [financeRule],
      girlfriendId: "gf_minseo",
      relationshipDay: 1
    });

    expect(result.match?.rule.id).toBe("finance_investment_advice");
    expect(result.match?.matchedKeywords).toEqual(["삼성전자", "살까"]);
  });

  it("applies persona-specific hurt response for gf_minseo", () => {
    const result = evaluateSensitiveTopic({
      content: "삼성전자 주식 살까?",
      rules: [financeRule],
      girlfriendId: "gf_minseo",
      relationshipDay: 1
    });

    expect(result.match?.policy.response).toContain("갑자기");
    expect(result.match?.policy.effects.affection).toBe(-6);
  });

  it("applies persona-specific brush-off response for gf_jiyoon", () => {
    const result = evaluateSensitiveTopic({
      content: "삼성전자 주식 살까?",
      rules: [financeRule],
      girlfriendId: "gf_jiyoon",
      relationshipDay: 1
    });

    expect(result.match?.policy.response).toContain("잘 모르는데");
    expect(result.match?.policy.effects.comfort).toBe(-1);
  });

  it("does not match unless every keyword group has a hit", () => {
    const result = evaluateSensitiveTopic({
      content: "삼성전자 다녀?",
      rules: [financeRule],
      girlfriendId: "gf_minseo",
      relationshipDay: 1
    });

    expect(result.match).toBeNull();
  });
});
