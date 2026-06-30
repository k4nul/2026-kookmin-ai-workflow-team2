export type RoomStatus =
  | "ACTIVE"
  | "PENDING_REPLY"
  | "EVENT_ACTIVE"
  | "GIRLFRIEND_LEFT"
  | "BROKEN_UP"
  | "COOLDOWN";

export type ChatMode = "REALTIME" | "FAST";

export type Sender = "USER" | "GIRLFRIEND" | "SYSTEM";

export type MessageType =
  | "NORMAL"
  | "EVENT_OPENING"
  | "EVENT_REPLY"
  | "SENSITIVE_TOPIC_REPLY"
  | "BREAKUP"
  | "GIRLFRIEND_LEFT"
  | "DAY_END"
  | "FEEDBACK";

export type UserReplyTimingPolicy =
  | "EXPECT_FAST_REPLY"
  | "PREFERS_SPACE"
  | "CONTEXTUAL"
  | "MATURE_STABLE";

export type GirlfriendReplyPolicyType =
  | "AFTER_N_FIXED_DELAY"
  | "BURST_THEN_SILENCE"
  | "RANDOM_DELAY"
  | "SCHEDULED_BY_DAILY_ROUTINE";

export type TimingContext =
  | "NEEDS_ATTENTION"
  | "NEEDS_SUPPORT"
  | "NEEDS_SOFT_SUPPORT"
  | "NEEDS_REASSURANCE"
  | "NEEDS_SPACE"
  | "BALANCED_TRUST"
  | "BALANCED_REASSURANCE"
  | "RELATIONSHIP_RECOVERY";

export type ReplyDelayChoice =
  | "NOW"
  | "AFTER_5_MIN"
  | "AFTER_30_MIN"
  | "AFTER_1_HOUR"
  | "AFTER_3_HOURS"
  | "AFTER_HALF_DAY"
  | "AFTER_NEXT_DAY";

export type EventStatus = "ACTIVE" | "COMPLETED" | "FAILED" | "EXPIRED";

export type PendingReplyJobStatus = "PENDING" | "DONE" | "CANCELLED";

export type EventIntent =
  | "SUPPORTIVE"
  | "APOLOGETIC"
  | "DISMISSIVE"
  | "BLAMING"
  | "CONTROLLING"
  | "JEALOUS"
  | "INDIFFERENT"
  | "DEFENSIVE"
  | "ROMANTIC"
  | "BALANCED_TRUST"
  | "UNKNOWN";

export interface RelationshipScores {
  affection: number;
  trust: number;
  comfort: number;
  stress: number;
  suspicion: number;
  jealousy: number;
  violationScore: number;
}

export type ScoreEffects = Partial<RelationshipScores>;

export interface GirlfriendReplyPolicy {
  type: GirlfriendReplyPolicyType;
  immediateReplyCount?: number;
  delayAfterImmediateSeconds?: number;
  burstCount?: number;
  silenceSeconds?: number;
  minDelaySeconds?: number;
  maxDelaySeconds?: number;
  contextSensitive?: boolean;
  workHourDelaySeconds?: number;
  normalDelaySeconds?: number;
}

export interface GirlfriendConfig {
  id: string;
  name: string;
  displayName: string;
  difficulty: string;
  personaType: string;
  personality: string;
  description: string;
  personaPrompt: string;
  baseScores: RelationshipScores;
  girlfriendReplyPolicy: GirlfriendReplyPolicy;
  userReplyTimingPolicy: UserReplyTimingPolicy;
  eventWeights: Record<string, number>;
}

export interface ForbiddenRuleConfig {
  id: string;
  scope: "COMMON" | "STAGE" | "PERSONA" | "EVENT";
  girlfriendId?: string | null;
  label: string;
  type: string;
  keywords: string[];
  points: number;
  minDay: number;
  maxDay?: number | null;
  activeEventId?: string | null;
  enabled?: boolean;
}

export interface SensitiveTopicPolicy {
  response: string;
  effects: ScoreEffects;
  resultLabel?: string;
}

export interface SensitiveTopicRuleConfig {
  id: string;
  label: string;
  category: string;
  priority: number;
  enabled?: boolean;
  minDay?: number | null;
  maxDay?: number | null;
  match: {
    keywordGroups: string[][];
  };
  defaultPolicy: SensitiveTopicPolicy;
  personaPolicies: Record<string, SensitiveTopicPolicy>;
}

export interface SensitiveTopicMatch {
  rule: SensitiveTopicRuleConfig;
  policy: SensitiveTopicPolicy;
  matchedKeywords: string[];
}

export interface EventTriggerConfig {
  relationshipDayEquals?: number;
  minDay?: number;
  maxDay?: number;
  stressMin?: number;
  suspicionMin?: number;
  trustMax?: number;
  trustMin?: number;
  affectionMax?: number;
  comfortMax?: number;
  failedEventsMin?: number;
  baseChance?: number;
}

export interface EventTemplateConfig {
  id: string;
  name: string;
  category: string;
  hidden: boolean;
  priority: number;
  trigger: EventTriggerConfig;
  openingMessage: string;
  timingContext: TimingContext;
  steps: Array<{ step: number; prompt: string }>;
  effects: {
    success: ScoreEffects;
    failure: ScoreEffects;
    failureCanBreakup?: boolean;
  };
  minDay?: number | null;
  maxDay?: number | null;
  cooldownDays: number;
  enabled?: boolean;
}

export interface Room {
  id: string;
  userId: string;
  girlfriendId: string;
  mode: ChatMode;
  status: RoomStatus;
  relationshipStartedAt: string;
  fastDay: number;
  fastVisibleMessageCountToday: number;
  fastUserTurnCountToday: number;
  cooldownUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  roomId: string;
  sender: Sender;
  content: string;
  messageType: MessageType;
  virtualDelayLabel: string | null;
  createdAt: string;
}

export interface RoomEvent {
  id: string;
  roomId: string;
  eventTemplateId: string;
  status: EventStatus;
  currentStep: number;
  hidden: boolean;
  startedAt: string;
  expiresAt: string | null;
  completedAt: string | null;
  eventState: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PendingReplyJob {
  id: string;
  roomId: string;
  dueAt: string;
  status: PendingReplyJobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TimingEvaluation {
  label: string;
  effects: ScoreEffects;
}

export interface ViolationMatch {
  rule: ForbiddenRuleConfig;
  points: number;
  matchedKeywords: string[];
}

export const replyDelaySeconds: Record<ReplyDelayChoice, number> = {
  NOW: 0,
  AFTER_5_MIN: 300,
  AFTER_30_MIN: 1800,
  AFTER_1_HOUR: 3600,
  AFTER_3_HOURS: 10800,
  AFTER_HALF_DAY: 43200,
  AFTER_NEXT_DAY: 86400
};
