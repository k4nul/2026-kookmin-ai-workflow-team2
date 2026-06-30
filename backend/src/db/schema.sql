CREATE TABLE IF NOT EXISTS girlfriends (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  persona_type TEXT NOT NULL,
  persona_prompt TEXT NOT NULL,
  base_scores_json TEXT NOT NULL,
  girlfriend_reply_policy_json TEXT NOT NULL,
  user_reply_timing_policy_json TEXT NOT NULL,
  event_weights_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_rooms (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  girlfriend_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  relationship_started_at TEXT NOT NULL,
  fast_day INTEGER NOT NULL DEFAULT 1,
  fast_visible_message_count_today INTEGER NOT NULL DEFAULT 0,
  fast_user_turn_count_today INTEGER NOT NULL DEFAULT 0,
  cooldown_until TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS relationship_scores (
  room_id TEXT PRIMARY KEY,
  affection INTEGER NOT NULL DEFAULT 50,
  trust INTEGER NOT NULL DEFAULT 50,
  comfort INTEGER NOT NULL DEFAULT 50,
  stress INTEGER NOT NULL DEFAULT 0,
  suspicion INTEGER NOT NULL DEFAULT 0,
  jealousy INTEGER NOT NULL DEFAULT 0,
  violation_score INTEGER NOT NULL DEFAULT 0,
  hidden_flags_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL,
  virtual_delay_label TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS forbidden_rules (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  girlfriend_id TEXT,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  keywords_json TEXT NOT NULL,
  points INTEGER NOT NULL,
  min_day INTEGER NOT NULL,
  max_day INTEGER,
  active_event_id TEXT,
  enabled INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sensitive_topic_rules (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  match_json TEXT NOT NULL,
  default_policy_json TEXT NOT NULL,
  persona_policies_json TEXT NOT NULL,
  min_day INTEGER,
  max_day INTEGER,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sensitive_topic_events (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  girlfriend_id TEXT NOT NULL,
  user_message_id TEXT NOT NULL,
  relationship_day INTEGER NOT NULL,
  matched_keywords_json TEXT NOT NULL,
  effects_json TEXT NOT NULL,
  response_text TEXT NOT NULL,
  result_label TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS violation_events (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  user_message_id TEXT NOT NULL,
  points INTEGER NOT NULL,
  relationship_day INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS event_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 100,
  trigger_json TEXT NOT NULL,
  opening_message TEXT NOT NULL,
  steps_json TEXT NOT NULL,
  effects_json TEXT NOT NULL,
  min_day INTEGER,
  max_day INTEGER,
  cooldown_days INTEGER NOT NULL DEFAULT 1,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS room_events (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  event_template_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 1,
  hidden INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  expires_at TEXT,
  completed_at TEXT,
  event_state_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_reply_timing_events (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  girlfriend_message_id TEXT,
  user_message_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  delay_seconds INTEGER NOT NULL,
  delay_label TEXT NOT NULL,
  timing_result TEXT NOT NULL,
  effects_json TEXT NOT NULL,
  active_event_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pending_reply_jobs (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  due_at TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_room_created ON messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_room_events_room_status ON room_events(room_id, status);
CREATE INDEX IF NOT EXISTS idx_pending_reply_jobs_status_due ON pending_reply_jobs(status, due_at);
