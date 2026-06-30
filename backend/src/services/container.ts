import type { Database } from "better-sqlite3";
import { EventRepository } from "../db/repositories/event.repository.js";
import { ForbiddenRuleRepository } from "../db/repositories/forbidden-rule.repository.js";
import { GirlfriendRepository } from "../db/repositories/girlfriend.repository.js";
import { MessageRepository } from "../db/repositories/message.repository.js";
import { PendingJobRepository } from "../db/repositories/pending-job.repository.js";
import { RoomRepository } from "../db/repositories/room.repository.js";
import { ScoreRepository } from "../db/repositories/score.repository.js";
import { SensitiveTopicRepository } from "../db/repositories/sensitive-topic.repository.js";
import { TimingRepository } from "../db/repositories/timing.repository.js";
import { ViolationRepository } from "../db/repositories/violation.repository.js";
import { ChatService } from "./chat.service.js";
import { CooldownService } from "./cooldown.service.js";
import { EventEvaluationService } from "./event-evaluation.service.js";
import { EventService } from "./event.service.js";
import { EventTriggerService } from "./event-trigger.service.js";
import { FeedbackService } from "./feedback.service.js";
import { GirlfriendService } from "./girlfriend.service.js";
import { LlmClientService } from "./llm-client.service.js";
import { PromptBuilderService } from "./prompt-builder.service.js";
import { RealtimeModeService } from "./realtime-mode.service.js";
import { RoomService } from "./room.service.js";

export function createServiceContainer(db: Database) {
  const roomRepository = new RoomRepository(db);
  const girlfriendRepository = new GirlfriendRepository(db);
  const messageRepository = new MessageRepository(db);
  const scoreRepository = new ScoreRepository(db);
  const sensitiveTopicRepository = new SensitiveTopicRepository(db);
  const forbiddenRuleRepository = new ForbiddenRuleRepository(db);
  const violationRepository = new ViolationRepository(db);
  const timingRepository = new TimingRepository(db);
  const eventRepository = new EventRepository(db);
  const pendingJobRepository = new PendingJobRepository(db);

  const llmClient = new LlmClientService();
  const promptBuilder = new PromptBuilderService();
  const cooldownService = new CooldownService();
  const eventTriggerService = new EventTriggerService();
  const eventEvaluationService = new EventEvaluationService();
  const girlfriendService = new GirlfriendService(girlfriendRepository);
  const feedbackService = new FeedbackService(llmClient);
  const eventService = new EventService(eventRepository, messageRepository, roomRepository);
  const realtimeModeService = new RealtimeModeService(pendingJobRepository, roomRepository);
  const roomService = new RoomService(db, roomRepository, scoreRepository, girlfriendService);
  const chatService = new ChatService(
    roomRepository,
    girlfriendRepository,
    messageRepository,
    scoreRepository,
    sensitiveTopicRepository,
    forbiddenRuleRepository,
    violationRepository,
    timingRepository,
    eventRepository,
    pendingJobRepository,
    cooldownService,
    eventService,
    eventTriggerService,
    eventEvaluationService,
    realtimeModeService,
    llmClient,
    promptBuilder,
    feedbackService
  );

  return {
    repositories: {
      roomRepository,
      girlfriendRepository,
      messageRepository,
      scoreRepository,
      sensitiveTopicRepository,
      forbiddenRuleRepository,
      violationRepository,
      timingRepository,
      eventRepository,
      pendingJobRepository
    },
    services: {
      chatService,
      cooldownService,
      eventEvaluationService,
      eventService,
      eventTriggerService,
      feedbackService,
      girlfriendService,
      llmClient,
      promptBuilder,
      realtimeModeService,
      roomService
    }
  };
}

export type ServiceContainer = ReturnType<typeof createServiceContainer>;
