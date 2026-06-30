import { env } from "../config/env.js";
import type { EventIntent, Message } from "../types/domain.js";
import { newId } from "../utils/ids.js";

const fallbackReplies: Record<string, string> = {
  gf_minseo: "나 지금 뭐라고 해야 할지 모르겠어.",
  gf_jiyoon: "잠깐 생각 좀 할게.",
  gf_seoa: "지금은 말이 잘 안 나와.",
  gf_harin: "이 얘기는 조금 있다가 다시 하자.",
  default: "잠깐만, 나중에 다시 얘기하자."
};

const allowedIntents: EventIntent[] = [
  "SUPPORTIVE",
  "APOLOGETIC",
  "DISMISSIVE",
  "BLAMING",
  "CONTROLLING",
  "JEALOUS",
  "INDIFFERENT",
  "DEFENSIVE",
  "ROMANTIC",
  "BALANCED_TRUST",
  "UNKNOWN"
];

export class LlmClientService {
  async generateChat(input: {
    girlfriendId: string;
    roomId: string;
    purpose: "girlfriend_reply" | "event_reply";
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  }): Promise<{ content: string; fallback: boolean }> {
    const fallback = fallbackReplies[input.girlfriendId] ?? fallbackReplies.default;

    try {
      const response = await this.postJson("/v1/chat/generate", {
        requestId: newId("llm"),
        model: env.LLM_GATEWAY_MODEL,
        messages: input.messages,
        options: {
          temperature: 0.75,
          top_p: 0.9,
          num_predict: 120
        },
        metadata: {
          purpose: input.purpose,
          roomId: input.roomId,
          girlfriendId: input.girlfriendId
        }
      });

      const payload = (await response.json()) as { ok?: boolean; content?: string; fallback?: boolean };
      if (!response.ok || !payload.ok || !payload.content) {
        return { content: fallback, fallback: true };
      }

      return { content: sanitizeOutput(payload.content), fallback: payload.fallback === true };
    } catch {
      return { content: fallback, fallback: true };
    }
  }

  async classifyIntent(input: {
    eventId?: string;
    girlfriendMessage: string;
    userMessage: string;
  }): Promise<EventIntent> {
    try {
      const response = await this.postJson("/v1/classify/intent", {
        requestId: newId("intent"),
        model: env.LLM_GATEWAY_MODEL,
        context: {
          eventId: input.eventId,
          girlfriendMessage: input.girlfriendMessage,
          userMessage: input.userMessage
        },
        allowedIntents: allowedIntents
      });
      const payload = (await response.json()) as { ok?: boolean; intent?: EventIntent };
      if (!response.ok || !payload.ok || !payload.intent || !allowedIntents.includes(payload.intent)) {
        return "UNKNOWN";
      }

      return payload.intent;
    } catch {
      return "UNKNOWN";
    }
  }

  async generateDailyFeedback(input: { roomId: string; messages: Message[] }): Promise<string | null> {
    try {
      const response = await this.postJson("/v1/feedback/daily", {
        requestId: newId("feedback"),
        model: env.LLM_GATEWAY_MODEL,
        roomId: input.roomId,
        messages: input.messages.map((message) => ({
          sender: message.sender,
          content: message.content,
          type: message.messageType,
          createdAt: message.createdAt
        }))
      });
      const payload = (await response.json()) as { ok?: boolean; content?: string };
      return response.ok && payload.ok && payload.content ? sanitizeOutput(payload.content) : null;
    } catch {
      return null;
    }
  }

  private async postJson(path: string, body: unknown): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      return await fetch(`${env.LLM_GATEWAY_BASE_URL}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Api-Key": env.LLM_GATEWAY_API_KEY
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}

function sanitizeOutput(content: string): string {
  return content.trim().replace(/\s{3,}/g, " ").slice(0, 800);
}
