import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Database as DatabaseType } from "better-sqlite3";
import { env } from "../config/env.js";
import type {
  EventTemplateConfig,
  ForbiddenRuleConfig,
  GirlfriendConfig,
  SensitiveTopicRuleConfig
} from "../types/domain.js";
import { nowIso } from "../utils/time.js";

let database: DatabaseType | null = null;

function readJson<T>(relativePath: string): T {
  const url = new URL(relativePath, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8")) as T;
}

function loadSchema(): string {
  return readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
}

export function getDatabase(): DatabaseType {
  if (!database) {
    database = initializeDatabase(env.DATABASE_PATH);
  }

  return database;
}

export function initializeDatabase(databasePath: string): DatabaseType {
  const resolvedPath = resolve(databasePath);
  const parent = dirname(resolvedPath);
  if (!existsSync(parent)) {
    mkdirSync(parent, { recursive: true });
  }

  const db = new Database(resolvedPath);
  db.pragma("journal_mode = WAL");
  db.exec(loadSchema());
  seedDatabase(db);
  return db;
}

export function closeDatabase(): void {
  database?.close();
  database = null;
}

function seedDatabase(db: DatabaseType): void {
  const createdAt = nowIso();
  const girlfriends = readJson<GirlfriendConfig[]>("../config/girlfriends.json");
  const forbiddenRules = readJson<ForbiddenRuleConfig[]>("../config/forbidden-rules.json");
  const sensitiveTopics = readJson<SensitiveTopicRuleConfig[]>("../config/sensitive-topics.json");
  const events = readJson<EventTemplateConfig[]>("../config/events.json");

  const insertGirlfriend = db.prepare(`
    INSERT INTO girlfriends (
      id, name, display_name, difficulty, persona_type, persona_prompt,
      base_scores_json, girlfriend_reply_policy_json,
      user_reply_timing_policy_json, event_weights_json, created_at
    )
    VALUES (
      @id, @name, @displayName, @difficulty, @personaType, @personaPrompt,
      @baseScoresJson, @girlfriendReplyPolicyJson,
      @userReplyTimingPolicyJson, @eventWeightsJson, @createdAt
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      display_name = excluded.display_name,
      difficulty = excluded.difficulty,
      persona_type = excluded.persona_type,
      persona_prompt = excluded.persona_prompt,
      base_scores_json = excluded.base_scores_json,
      girlfriend_reply_policy_json = excluded.girlfriend_reply_policy_json,
      user_reply_timing_policy_json = excluded.user_reply_timing_policy_json,
      event_weights_json = excluded.event_weights_json
  `);

  const insertForbiddenRule = db.prepare(`
    INSERT INTO forbidden_rules (
      id, scope, girlfriend_id, label, type, keywords_json, points,
      min_day, max_day, active_event_id, enabled
    )
    VALUES (
      @id, @scope, @girlfriendId, @label, @type, @keywordsJson, @points,
      @minDay, @maxDay, @activeEventId, @enabled
    )
    ON CONFLICT(id) DO UPDATE SET
      scope = excluded.scope,
      girlfriend_id = excluded.girlfriend_id,
      label = excluded.label,
      type = excluded.type,
      keywords_json = excluded.keywords_json,
      points = excluded.points,
      min_day = excluded.min_day,
      max_day = excluded.max_day,
      active_event_id = excluded.active_event_id,
      enabled = excluded.enabled
  `);

  const insertEvent = db.prepare(`
    INSERT INTO event_templates (
      id, name, category, hidden, priority, trigger_json, opening_message,
      steps_json, effects_json, min_day, max_day, cooldown_days, enabled, created_at
    )
    VALUES (
      @id, @name, @category, @hidden, @priority, @triggerJson, @openingMessage,
      @stepsJson, @effectsJson, @minDay, @maxDay, @cooldownDays, @enabled, @createdAt
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      hidden = excluded.hidden,
      priority = excluded.priority,
      trigger_json = excluded.trigger_json,
      opening_message = excluded.opening_message,
      steps_json = excluded.steps_json,
      effects_json = excluded.effects_json,
      min_day = excluded.min_day,
      max_day = excluded.max_day,
      cooldown_days = excluded.cooldown_days,
      enabled = excluded.enabled
  `);

  const insertSensitiveTopic = db.prepare(`
    INSERT INTO sensitive_topic_rules (
      id, label, category, priority, match_json, default_policy_json,
      persona_policies_json, min_day, max_day, enabled, created_at
    )
    VALUES (
      @id, @label, @category, @priority, @matchJson, @defaultPolicyJson,
      @personaPoliciesJson, @minDay, @maxDay, @enabled, @createdAt
    )
    ON CONFLICT(id) DO UPDATE SET
      label = excluded.label,
      category = excluded.category,
      priority = excluded.priority,
      match_json = excluded.match_json,
      default_policy_json = excluded.default_policy_json,
      persona_policies_json = excluded.persona_policies_json,
      min_day = excluded.min_day,
      max_day = excluded.max_day,
      enabled = excluded.enabled
  `);

  const transaction = db.transaction(() => {
    for (const girlfriend of girlfriends) {
      insertGirlfriend.run({
        ...girlfriend,
        baseScoresJson: JSON.stringify(girlfriend.baseScores),
        girlfriendReplyPolicyJson: JSON.stringify(girlfriend.girlfriendReplyPolicy),
        userReplyTimingPolicyJson: JSON.stringify(girlfriend.userReplyTimingPolicy),
        eventWeightsJson: JSON.stringify(girlfriend.eventWeights),
        createdAt
      });
    }

    for (const rule of forbiddenRules) {
      insertForbiddenRule.run({
        ...rule,
        girlfriendId: rule.girlfriendId ?? null,
        keywordsJson: JSON.stringify(rule.keywords),
        maxDay: rule.maxDay ?? null,
        activeEventId: rule.activeEventId ?? null,
        enabled: rule.enabled === false ? 0 : 1
      });
    }

    for (const topic of sensitiveTopics) {
      insertSensitiveTopic.run({
        id: topic.id,
        label: topic.label,
        category: topic.category,
        priority: topic.priority,
        matchJson: JSON.stringify(topic.match),
        defaultPolicyJson: JSON.stringify(topic.defaultPolicy),
        personaPoliciesJson: JSON.stringify(topic.personaPolicies),
        minDay: topic.minDay ?? null,
        maxDay: topic.maxDay ?? null,
        enabled: topic.enabled === false ? 0 : 1,
        createdAt
      });
    }

    for (const event of events) {
      insertEvent.run({
        ...event,
        hidden: event.hidden ? 1 : 0,
        triggerJson: JSON.stringify(event.trigger),
        stepsJson: JSON.stringify(event.steps.map((step) => ({ ...step, timingContext: event.timingContext }))),
        effectsJson: JSON.stringify(event.effects),
        minDay: event.minDay ?? null,
        maxDay: event.maxDay ?? null,
        enabled: event.enabled === false ? 0 : 1,
        createdAt
      });
    }
  });

  transaction();
}
