import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "../config/env.js";
import { LlmClientService } from "../services/llm-client.service.js";

describe("LlmClientService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("passes the configured gateway model to LLM Gateway requests", async () => {
    const requestBodies: Array<{ model?: string }> = [];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        requestBodies.push(JSON.parse(String(init?.body)));

        return new Response(
          JSON.stringify({
            ok: true,
            content: "응답",
            intent: "SUPPORTIVE"
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json"
            }
          }
        );
      })
    );

    const client = new LlmClientService();

    await client.generateChat({
      girlfriendId: "gf_minseo",
      roomId: "room_001",
      purpose: "girlfriend_reply",
      messages: [{ role: "user", content: "안녕" }]
    });
    await client.classifyIntent({
      girlfriendMessage: "오늘 힘들었어.",
      userMessage: "많이 힘들었겠다."
    });
    await client.generateDailyFeedback({
      roomId: "room_001",
      messages: []
    });

    expect(requestBodies).toHaveLength(3);
    expect(requestBodies.map((body) => body.model)).toEqual([
      env.LLM_GATEWAY_MODEL,
      env.LLM_GATEWAY_MODEL,
      env.LLM_GATEWAY_MODEL
    ]);
  });
});
