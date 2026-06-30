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
import { env } from "../config/env.js";
import type { EventIntent, EventTemplateConfig, Message, ReplyDelayChoice, Room, SensitiveTopicMatch } from "../types/domain.js";
import { HttpError } from "../utils/http-error.js";
import { addSecondsIso, calculateRelationshipDay, isCooldownActive, remainingSeconds, secondsBetween } from "../utils/time.js";
import { CooldownService } from "./cooldown.service.js";
import { EventEvaluationService } from "./event-evaluation.service.js";
import { EventService } from "./event.service.js";
import { EventTriggerService } from "./event-trigger.service.js";
import { FeedbackService } from "./feedback.service.js";
import { LlmClientService } from "./llm-client.service.js";
import { PromptBuilderService } from "./prompt-builder.service.js";
import { RealtimeModeService } from "./realtime-mode.service.js";
import { completeFastModeExchange } from "./fast-mode.service.js";
import { replyDelayChoiceToLabel, replyDelayChoiceToSeconds, virtualDelayLabel } from "./reply-delay.service.js";
import { evaluateUserReplyTiming } from "./reply-timing.service.js";
import { evaluateSensitiveTopic } from "./sensitive-topic.service.js";
import { evaluateForbiddenRules } from "./violation.service.js";

const breakupMessage = "왜 그런식으로 말해? 헤어져";

export class ChatService {
  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly girlfriendRepository: GirlfriendRepository,
    private readonly messageRepository: MessageRepository,
    private readonly scoreRepository: ScoreRepository,
    private readonly sensitiveTopicRepository: SensitiveTopicRepository,
    private readonly forbiddenRuleRepository: ForbiddenRuleRepository,
    private readonly violationRepository: ViolationRepository,
    private readonly timingRepository: TimingRepository,
    private readonly eventRepository: EventRepository,
    private readonly pendingJobRepository: PendingJobRepository,
    private readonly cooldownService: CooldownService,
    private readonly eventService: EventService,
    private readonly eventTriggerService: EventTriggerService,
    private readonly eventEvaluationService: EventEvaluationService,
    private readonly realtimeModeService: RealtimeModeService,
    private readonly llmClient: LlmClientService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly feedbackService: FeedbackService
  ) {}

  listMessages(roomId: string): Message[] {
    this.getRoomRequired(roomId);
    return this.messageRepository.listByRoom(roomId);
  }

  async handleUserMessage(input: {
    roomId: string;
    content: string;
    replyDelayChoice?: ReplyDelayChoice;
  }): Promise<Record<string, unknown>> {
    const room = this.getRoomRequired(input.roomId);
    this.assertRoomCanReceiveMessage(room);

    const girlfriend = this.getGirlfriendRequired(room.girlfriendId);
    let scores = this.getScoresRequired(room.id);
    const relationshipDay = calculateRelationshipDay(room);
    const activeRoomEvent = this.eventRepository.findActiveByRoomId(room.id);
    const activeEventTemplate = activeRoomEvent
      ? this.eventRepository.findTemplateById(activeRoomEvent.eventTemplateId)
      : null;

    const delay = this.determineUserReplyDelay(room, input.replyDelayChoice);
    const timing = evaluateUserReplyTiming({
      policy: girlfriend.userReplyTimingPolicy,
      delaySeconds: delay.delaySeconds,
      timingContext: activeEventTemplate?.timingContext,
      importantEvent: Boolean(activeEventTemplate)
    });

    const userMessage = this.messageRepository.create({
      roomId: room.id,
      sender: "USER",
      content: input.content,
      messageType: "NORMAL",
      virtualDelayLabel: delay.virtualDelayLabel
    });

    this.timingRepository.create({
      roomId: room.id,
      girlfriendMessageId: delay.lastGirlfriendMessage?.id,
      userMessageId: userMessage.id,
      mode: room.mode,
      delaySeconds: delay.delaySeconds,
      delayLabel: delay.delayLabel,
      timingResult: timing.label,
      effects: timing.effects,
      activeEventId: activeRoomEvent?.id
    });

    if (Object.keys(timing.effects).length > 0) {
      scores = this.scoreRepository.applyEffects(room.id, timing.effects);
    }

    const violationResult = evaluateForbiddenRules({
      content: input.content,
      rules: this.forbiddenRuleRepository.listEnabled(),
      girlfriendId: room.girlfriendId,
      relationshipDay,
      activeEventId: activeEventTemplate?.id
    });

    if (violationResult.matches.length > 0) {
      this.violationRepository.createMany({
        roomId: room.id,
        userMessageId: userMessage.id,
        relationshipDay,
        matches: violationResult.matches
      });
      scores = this.scoreRepository.addViolation(room.id, violationResult.totalPoints);
    }

    if (scores.violationScore >= 100) {
      return this.breakup(room, girlfriend.displayName, "BROKEN_UP");
    }

    const sensitiveTopic = evaluateSensitiveTopic({
      content: input.content,
      rules: this.sensitiveTopicRepository.listEnabled(),
      girlfriendId: room.girlfriendId,
      relationshipDay
    });

    if (sensitiveTopic.match) {
      return await this.handleSensitiveTopic({
        room,
        userMessage,
        girlfriendId: girlfriend.id,
        relationshipDay,
        match: sensitiveTopic.match
      });
    }

    if (activeRoomEvent && activeEventTemplate) {
      return await this.handleActiveEvent({
        room,
        userMessage,
        activeRoomEventId: activeRoomEvent.id,
        template: activeEventTemplate,
        girlfriendDisplayName: girlfriend.displayName,
        userContent: input.content
      });
    }

    const triggered = this.eventTriggerService.selectEvent({
      room,
      scores,
      templates: this.eventRepository.listTemplates(),
      failedEvents: this.eventRepository.countFailedByRoomId(room.id)
    });

    if (triggered) {
      const started = this.eventService.startEvent(room, triggered);
      return {
        result: "EVENT_STARTED",
        roomId: room.id,
        eventId: triggered.id,
        openingMessageId: started.openingMessageId,
        status: "EVENT_ACTIVE"
      };
    }

    if (room.mode === "FAST") {
      return await this.handleFastMode(room, girlfriend.id);
    }

    return await this.handleRealtimeMode(room, girlfriend.id);
  }

  async processDuePendingReplies(): Promise<number> {
    const jobs = this.pendingJobRepository.dueJobs(new Date().toISOString());
    let processed = 0;

    for (const job of jobs) {
      const room = this.roomRepository.findById(job.roomId);
      if (!room || room.status === "COOLDOWN" || room.status === "BROKEN_UP" || room.status === "GIRLFRIEND_LEFT") {
        this.pendingJobRepository.markDone(job.id);
        continue;
      }

      const girlfriend = this.getGirlfriendRequired(room.girlfriendId);
      const scores = this.getScoresRequired(room.id);
      const activeRoomEvent = this.eventRepository.findActiveByRoomId(room.id);
      const activeEventTemplate = activeRoomEvent
        ? this.eventRepository.findTemplateById(activeRoomEvent.eventTemplateId)
        : null;
      const recentMessages = this.messageRepository.recentByRoom(room.id, 20);
      const llmMessages = this.promptBuilder.buildGirlfriendReplyMessages({
        girlfriend,
        room,
        scores,
        recentMessages,
        activeEvent: activeEventTemplate
      });
      const reply = await this.llmClient.generateChat({
        girlfriendId: girlfriend.id,
        roomId: room.id,
        purpose: activeEventTemplate ? "event_reply" : "girlfriend_reply",
        messages: llmMessages
      });
      this.messageRepository.create({
        roomId: room.id,
        sender: "GIRLFRIEND",
        content: reply.content,
        messageType: activeEventTemplate ? "EVENT_REPLY" : "NORMAL"
      });
      this.pendingJobRepository.markDone(job.id);

      if (!this.eventRepository.findActiveByRoomId(room.id)) {
        this.roomRepository.updateStatus(room.id, "ACTIVE");
      }

      processed += 1;
    }

    return processed;
  }

  private async handleActiveEvent(input: {
    room: Room;
    userMessage: Message;
    activeRoomEventId: string;
    template: EventTemplateConfig;
    girlfriendDisplayName: string;
    userContent: string;
  }): Promise<Record<string, unknown>> {
    let intent: EventIntent = this.eventEvaluationService.classifyLocalIntent(input.userContent);
    if (intent === "UNKNOWN") {
      intent = await this.llmClient.classifyIntent({
        eventId: input.template.id,
        girlfriendMessage: input.template.openingMessage,
        userMessage: input.userContent
      });
    }

    const success = this.eventEvaluationService.isSuccess(input.template, intent);
    const effects = success ? input.template.effects.success : input.template.effects.failure;
    const scores = this.scoreRepository.applyEffects(input.room.id, effects);
    this.eventRepository.complete(input.activeRoomEventId, success ? "COMPLETED" : "FAILED", {
      intent,
      success,
      userMessageId: input.userMessage.id
    });

    if (!success && input.template.effects.failureCanBreakup) {
      return this.breakup(input.room, input.girlfriendDisplayName, "EVENT_BREAKUP");
    }

    const girlfriend = this.getGirlfriendRequired(input.room.girlfriendId);
    const recentMessages = this.messageRepository.recentByRoom(input.room.id, 20);
    const reply = await this.generateGirlfriendReply({
      room: input.room,
      girlfriendId: girlfriend.id,
      activeEvent: input.template,
      purpose: "event_reply"
    });
    const girlfriendMessage = this.messageRepository.create({
      roomId: input.room.id,
      sender: "GIRLFRIEND",
      content: reply,
      messageType: "EVENT_REPLY"
    });
    this.roomRepository.updateStatus(input.room.id, "ACTIVE");

    return {
      result: success ? "EVENT_COMPLETED" : "EVENT_FAILED",
      intent,
      scores: env.DEBUG_EXPOSE_SCORES ? scores : undefined,
      messages: [girlfriendMessage],
      recentMessageCount: recentMessages.length
    };
  }

  private async handleFastMode(room: Room, girlfriendId: string): Promise<Record<string, unknown>> {
    const exchange = completeFastModeExchange(
      {
        fastDay: room.fastDay,
        fastVisibleMessageCountToday: room.fastVisibleMessageCountToday,
        fastUserTurnCountToday: room.fastUserTurnCountToday
      },
      {
        userTurnsPerDay: env.FAST_MODE_USER_TURNS_PER_DAY,
        messagesPerDay: env.FAST_MODE_MESSAGES_PER_DAY
      }
    );

    const messages: Message[] = [];
    if (exchange.forcedDayEnd && exchange.girlfriendReply) {
      messages.push(
        this.messageRepository.create({
          roomId: room.id,
          sender: "GIRLFRIEND",
          content: exchange.girlfriendReply,
          messageType: "DAY_END"
        })
      );
      if (exchange.dayEndSystemMessage) {
        messages.push(
          this.messageRepository.create({
            roomId: room.id,
            sender: "SYSTEM",
            content: exchange.dayEndSystemMessage,
            messageType: "DAY_END"
          })
        );
      }
      const feedback = await this.feedbackService.dailyFeedback(room.id, this.messageRepository.recentByRoom(room.id, 20));
      messages.push(
        this.messageRepository.create({
          roomId: room.id,
          sender: "SYSTEM",
          content: feedback,
          messageType: "FEEDBACK"
        })
      );
    } else {
      const reply = await this.generateGirlfriendReply({
        room,
        girlfriendId,
        purpose: "girlfriend_reply"
      });
      messages.push(
        this.messageRepository.create({
          roomId: room.id,
          sender: "GIRLFRIEND",
          content: reply,
          messageType: "NORMAL"
        })
      );
    }

    this.roomRepository.updateFastCounters(room.id, {
      fastDay: exchange.fastDay,
      fastVisibleMessageCountToday: exchange.fastVisibleMessageCountToday,
      fastUserTurnCountToday: exchange.fastUserTurnCountToday
    });
    this.roomRepository.updateStatus(room.id, "ACTIVE");

    return {
      result: exchange.forcedDayEnd ? "FAST_DAY_ENDED" : "REPLIED",
      roomId: room.id,
      status: "ACTIVE",
      fastDay: exchange.fastDay,
      messages
    };
  }

  private async handleSensitiveTopic(input: {
    room: Room;
    userMessage: Message;
    girlfriendId: string;
    relationshipDay: number;
    match: SensitiveTopicMatch;
  }): Promise<Record<string, unknown>> {
    const scores = this.scoreRepository.applyEffects(input.room.id, input.match.policy.effects);
    this.sensitiveTopicRepository.createEvent({
      roomId: input.room.id,
      girlfriendId: input.girlfriendId,
      userMessageId: input.userMessage.id,
      relationshipDay: input.relationshipDay,
      match: input.match
    });

    const replyMessage = this.messageRepository.create({
      roomId: input.room.id,
      sender: "GIRLFRIEND",
      content: input.match.policy.response,
      messageType: "SENSITIVE_TOPIC_REPLY"
    });

    const extraMessages: Message[] = [];
    if (input.room.mode === "FAST") {
      const nextUserTurns = input.room.fastUserTurnCountToday + 1;
      const nextVisibleCount = input.room.fastVisibleMessageCountToday + 2;
      const dayEnded = nextUserTurns >= env.FAST_MODE_USER_TURNS_PER_DAY;
      const completedDay = input.room.fastDay;

      this.roomRepository.updateFastCounters(input.room.id, {
        fastDay: dayEnded ? completedDay + 1 : completedDay,
        fastVisibleMessageCountToday: dayEnded ? 0 : Math.min(env.FAST_MODE_MESSAGES_PER_DAY, nextVisibleCount),
        fastUserTurnCountToday: dayEnded ? 0 : nextUserTurns
      });

      if (dayEnded) {
        extraMessages.push(
          this.messageRepository.create({
            roomId: input.room.id,
            sender: "SYSTEM",
            content: `${completedDay}일차가 종료되었습니다.`,
            messageType: "DAY_END"
          })
        );
        const feedback = await this.feedbackService.dailyFeedback(
          input.room.id,
          this.messageRepository.recentByRoom(input.room.id, 20)
        );
        extraMessages.push(
          this.messageRepository.create({
            roomId: input.room.id,
            sender: "SYSTEM",
            content: feedback,
            messageType: "FEEDBACK"
          })
        );
      }
    }

    const status = input.room.status === "EVENT_ACTIVE" ? "EVENT_ACTIVE" : "ACTIVE";
    this.roomRepository.updateStatus(input.room.id, status);

    return {
      result: "SENSITIVE_TOPIC_HANDLED",
      topicId: input.match.rule.id,
      topicCategory: input.match.rule.category,
      resultLabel: input.match.policy.resultLabel,
      status,
      messages: [replyMessage, ...extraMessages],
      scores: env.DEBUG_EXPOSE_SCORES ? scores : undefined
    };
  }

  private async handleRealtimeMode(room: Room, girlfriendId: string): Promise<Record<string, unknown>> {
    const girlfriend = this.getGirlfriendRequired(girlfriendId);
    const scheduled = this.realtimeModeService.scheduleOrGetPending(room, girlfriend);

    if (scheduled.immediate) {
      const reply = await this.generateGirlfriendReply({
        room,
        girlfriendId,
        purpose: "girlfriend_reply"
      });
      const message = this.messageRepository.create({
        roomId: room.id,
        sender: "GIRLFRIEND",
        content: reply,
        messageType: "NORMAL"
      });
      this.roomRepository.updateStatus(room.id, "ACTIVE");
      return { result: "REPLIED", roomId: room.id, messages: [message], status: "ACTIVE" };
    }

    return {
      result: scheduled.existing ? "PENDING_REPLY_EXISTS" : "PENDING_REPLY",
      roomId: room.id,
      dueAt: scheduled.dueAt,
      status: "PENDING_REPLY"
    };
  }

  private determineUserReplyDelay(room: Room, replyDelayChoice: ReplyDelayChoice | undefined): {
    delaySeconds: number;
    delayLabel: string;
    virtualDelayLabel: string | null;
    lastGirlfriendMessage: Message | null;
  } {
    const lastGirlfriendMessage = this.messageRepository.lastGirlfriendMessage(room.id);
    if (room.mode === "FAST") {
      const choice = replyDelayChoice ?? "NOW";
      return {
        delaySeconds: replyDelayChoiceToSeconds(choice),
        delayLabel: replyDelayChoiceToLabel(choice),
        virtualDelayLabel: virtualDelayLabel(choice),
        lastGirlfriendMessage
      };
    }

    return {
      delaySeconds: lastGirlfriendMessage ? secondsBetween(lastGirlfriendMessage.createdAt) : 0,
      delayLabel: lastGirlfriendMessage ? `${secondsBetween(lastGirlfriendMessage.createdAt)}초` : "첫 메시지",
      virtualDelayLabel: null,
      lastGirlfriendMessage
    };
  }

  private async generateGirlfriendReply(input: {
    room: Room;
    girlfriendId: string;
    activeEvent?: EventTemplateConfig | null;
    purpose: "girlfriend_reply" | "event_reply";
  }): Promise<string> {
    const girlfriend = this.getGirlfriendRequired(input.girlfriendId);
    const scores = this.getScoresRequired(input.room.id);
    const recentMessages = this.messageRepository.recentByRoom(input.room.id, 20);
    const messages = this.promptBuilder.buildGirlfriendReplyMessages({
      girlfriend,
      room: input.room,
      scores,
      recentMessages,
      activeEvent: input.activeEvent
    });
    const reply = await this.llmClient.generateChat({
      girlfriendId: input.girlfriendId,
      roomId: input.room.id,
      purpose: input.purpose,
      messages
    });
    return reply.content;
  }

  private breakup(room: Room, girlfriendName: string, result: string): Record<string, unknown> {
    const cooldownUntil = addSecondsIso(new Date(), env.DEFAULT_COOLDOWN_SECONDS);
    const girlfriendMessage = this.messageRepository.create({
      roomId: room.id,
      sender: "GIRLFRIEND",
      content: breakupMessage,
      messageType: "BREAKUP"
    });
    const systemMessage = this.messageRepository.create({
      roomId: room.id,
      sender: "SYSTEM",
      content: `${girlfriendName}가 퇴장했습니다.`,
      messageType: "GIRLFRIEND_LEFT"
    });
    this.pendingJobRepository.cancelByRoomId(room.id);
    this.roomRepository.updateStatus(room.id, "COOLDOWN", cooldownUntil);

    return {
      result,
      status: "COOLDOWN",
      cooldownUntil,
      messages: [girlfriendMessage, systemMessage]
    };
  }

  private assertRoomCanReceiveMessage(room: Room): void {
    this.cooldownService.assertAvailable(room.cooldownUntil);

    if (room.status === "COOLDOWN" && room.cooldownUntil && isCooldownActive(room.cooldownUntil)) {
      throw new HttpError(423, "CHAT_LOCKED", "현재 채팅이 제한되어 있습니다.", {
        remainingSeconds: remainingSeconds(room.cooldownUntil),
        unlockOptions: ["AD", "PAYMENT"]
      });
    }

    if (room.status === "BROKEN_UP" || room.status === "GIRLFRIEND_LEFT") {
      throw new HttpError(409, "CHAT_CLOSED", "이미 종료된 채팅입니다.");
    }
  }

  private getRoomRequired(roomId: string): Room {
    const room = this.roomRepository.findById(roomId);
    if (!room) {
      throw new HttpError(404, "ROOM_NOT_FOUND", "채팅방을 찾을 수 없습니다.");
    }

    return room;
  }

  private getGirlfriendRequired(girlfriendId: string) {
    const girlfriend = this.girlfriendRepository.findById(girlfriendId);
    if (!girlfriend) {
      throw new HttpError(404, "GIRLFRIEND_NOT_FOUND", "선택한 캐릭터를 찾을 수 없습니다.");
    }

    return girlfriend;
  }

  private getScoresRequired(roomId: string) {
    const scores = this.scoreRepository.findByRoomId(roomId);
    if (!scores) {
      throw new HttpError(500, "SCORES_NOT_FOUND", "관계 점수 상태가 없습니다.");
    }

    return scores;
  }
}
