import type { Database } from "better-sqlite3";
import type { SensitiveTopicMatch, SensitiveTopicRuleConfig } from "../../types/domain.js";
import { newId } from "../../utils/ids.js";
import { nowIso } from "../../utils/time.js";

interface SensitiveTopicRuleRow {
  id: string;
  label: string;
  category: string;
  priority: number;
  match_json: string;
  default_policy_json: string;
  persona_policies_json: string;
  min_day: number | null;
  max_day: number | null;
  enabled: number;
}

function toRule(row: SensitiveTopicRuleRow): SensitiveTopicRuleConfig {
  return {
    id: row.id,
    label: row.label,
    category: row.category,
    priority: row.priority,
    match: JSON.parse(row.match_json),
    defaultPolicy: JSON.parse(row.default_policy_json),
    personaPolicies: JSON.parse(row.persona_policies_json),
    minDay: row.min_day,
    maxDay: row.max_day,
    enabled: row.enabled === 1
  };
}

export class SensitiveTopicRepository {
  constructor(private readonly db: Database) {}

  listEnabled(): SensitiveTopicRuleConfig[] {
    return this.db
      .prepare("SELECT * FROM sensitive_topic_rules WHERE enabled = 1 ORDER BY priority DESC")
      .all()
      .map((row) => toRule(row as SensitiveTopicRuleRow));
  }

  createEvent(input: {
    roomId: string;
    girlfriendId: string;
    userMessageId: string;
    relationshipDay: number;
    match: SensitiveTopicMatch;
  }): void {
    this.db
      .prepare(`
        INSERT INTO sensitive_topic_events (
          id, room_id, rule_id, girlfriend_id, user_message_id, relationship_day,
          matched_keywords_json, effects_json, response_text, result_label, created_at
        )
        VALUES (
          @id, @roomId, @ruleId, @girlfriendId, @userMessageId, @relationshipDay,
          @matchedKeywordsJson, @effectsJson, @responseText, @resultLabel, @createdAt
        )
      `)
      .run({
        id: newId("topic"),
        roomId: input.roomId,
        ruleId: input.match.rule.id,
        girlfriendId: input.girlfriendId,
        userMessageId: input.userMessageId,
        relationshipDay: input.relationshipDay,
        matchedKeywordsJson: JSON.stringify(input.match.matchedKeywords),
        effectsJson: JSON.stringify(input.match.policy.effects),
        responseText: input.match.policy.response,
        resultLabel: input.match.policy.resultLabel ?? null,
        createdAt: nowIso()
      });
  }
}
