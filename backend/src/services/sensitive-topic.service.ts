import type { SensitiveTopicMatch, SensitiveTopicRuleConfig } from "../types/domain.js";
import { normalizeMessage } from "../utils/normalize.js";

export interface SensitiveTopicEvaluation {
  match: SensitiveTopicMatch | null;
}

export function evaluateSensitiveTopic(input: {
  content: string;
  rules: SensitiveTopicRuleConfig[];
  girlfriendId: string;
  relationshipDay: number;
}): SensitiveTopicEvaluation {
  const normalizedContent = normalizeMessage(input.content);
  const sortedRules = [...input.rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    if (!isRuleActive(rule, input.relationshipDay)) {
      continue;
    }

    const matchedKeywords = matchKeywordGroups(normalizedContent, rule.match.keywordGroups);
    if (matchedKeywords.length === 0) {
      continue;
    }

    return {
      match: {
        rule,
        policy: rule.personaPolicies[input.girlfriendId] ?? rule.defaultPolicy,
        matchedKeywords
      }
    };
  }

  return { match: null };
}

function isRuleActive(rule: SensitiveTopicRuleConfig, relationshipDay: number): boolean {
  if (rule.enabled === false) {
    return false;
  }

  if (rule.minDay !== null && rule.minDay !== undefined && relationshipDay < rule.minDay) {
    return false;
  }

  if (rule.maxDay !== null && rule.maxDay !== undefined && relationshipDay > rule.maxDay) {
    return false;
  }

  return true;
}

function matchKeywordGroups(normalizedContent: string, keywordGroups: string[][]): string[] {
  const matchedKeywords: string[] = [];

  for (const group of keywordGroups) {
    const matchedInGroup = group.find((keyword) => normalizedContent.includes(normalizeMessage(keyword)));
    if (!matchedInGroup) {
      return [];
    }

    matchedKeywords.push(matchedInGroup);
  }

  return matchedKeywords;
}
