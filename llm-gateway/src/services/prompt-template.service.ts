import type { DailyFeedbackRequest, IntentClassifyRequest, ChatMessage } from "../types/dto.js";

const intentDefinitions = [
  "SUPPORTIVE: validates emotion, offers to listen, says they are on girlfriend's side.",
  "APOLOGETIC: admits fault and apologizes sincerely.",
  "ROMANTIC: expresses love, affection, or anniversary recognition.",
  "BALANCED_TRUST: expresses mild concern without control, says they trust her, asks for reasonable communication.",
  "DISMISSIVE: minimizes or ignores emotion.",
  "BLAMING: blames the girlfriend.",
  "CONTROLLING: demands proof, forbids behavior, asks for location/photo/phone.",
  "JEALOUS: accusatory jealousy.",
  "INDIFFERENT: detached, uncaring, uninterested.",
  "DEFENSIVE: focuses on defending self rather than understanding.",
  "UNKNOWN: unclear or not classifiable."
];

export function buildIntentClassificationMessages(
  request: IntentClassifyRequest,
  allowedIntents: string[]
): ChatMessage[] {
  return [
    {
      role: "system",
      content: [
        "You classify a user's reply in a relationship training game.",
        "Return only JSON.",
        "Do not generate girlfriend dialogue.",
        "Choose one intent from allowed intents.",
        "Use Korean reason.",
        "Do not include markdown.",
        "Do not include extra keys."
      ].join("\n")
    },
    {
      role: "user",
      content: [
        `eventId: ${request.context.eventId ?? ""}`,
        `girlfriendMessage: ${request.context.girlfriendMessage ?? ""}`,
        `userMessage: ${request.context.userMessage}`,
        `allowedIntents: ${JSON.stringify(allowedIntents)}`,
        "intentDefinitions:",
        ...intentDefinitions,
        "Expected JSON:",
        JSON.stringify({
          intent: "SUPPORTIVE",
          confidence: 0.82,
          reason: "..."
        })
      ].join("\n")
    }
  ];
}

export function buildDailyFeedbackMessages(request: DailyFeedbackRequest): ChatMessage[] {
  const userContent =
    "summary" in request
      ? [
          `girlfriend: ${request.girlfriend.displayName} (${request.girlfriend.id}, ${request.girlfriend.personaType})`,
          `day: ${request.day}`,
          `successfulEvents: ${JSON.stringify(request.summary.successfulEvents ?? [])}`,
          `failedEvents: ${JSON.stringify(request.summary.failedEvents ?? [])}`,
          `timingMistakes: ${JSON.stringify(request.summary.timingMistakes ?? [])}`,
          `contentMistakes: ${JSON.stringify(request.summary.contentMistakes ?? [])}`,
          `goodBehaviors: ${JSON.stringify(request.summary.goodBehaviors ?? [])}`
        ].join("\n")
      : [
          `roomId: ${request.roomId}`,
          "recentMessages:",
          ...request.messages.map((message) =>
            [
              `sender: ${message.sender}`,
              `type: ${message.type ?? ""}`,
              `createdAt: ${message.createdAt ?? ""}`,
              `content: ${message.content}`
            ].join(" | ")
          )
        ].join("\n");

  return [
    {
      role: "system",
      content: [
        "You write daily coaching feedback for a relationship training game.",
        "Korean only.",
        "2 to 5 sentences.",
        "No raw scores.",
        "No hidden flags.",
        "No server/internal rule exposure.",
        "Calm, direct, actionable tone."
      ].join("\n")
    },
    {
      role: "user",
      content: userContent
    }
  ];
}
