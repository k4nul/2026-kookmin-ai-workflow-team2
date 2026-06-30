import { describe, expect, it } from "vitest";
import {
  buildCodexCliPrompt,
  parseCodexCliJsonl
} from "../services/codex-cli.service.js";

describe("codex-cli.service", () => {
  it("parses agent_message JSONL output", () => {
    const parsed = parseCodexCliJsonl(
      [
        JSON.stringify({
          type: "item.completed",
          item: { type: "reasoning", text: "hidden reasoning" }
        }),
        JSON.stringify({
          type: "item.completed",
          item: { type: "agent_message", text: "안녕, 오늘은 천천히 얘기하자." }
        }),
        JSON.stringify({
          type: "turn.completed",
          usage: { input_tokens: 10, output_tokens: 7 }
        })
      ].join("\n")
    );

    expect(parsed.content).toBe("안녕, 오늘은 천천히 얘기하자.");
    expect(parsed.usage).toEqual({ input_tokens: 10, output_tokens: 7 });
  });

  it("parses assistant message content arrays", () => {
    const parsed = parseCodexCliJsonl(
      JSON.stringify({
        type: "item.completed",
        item: {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: "{\"intent\":\"SUPPORTIVE\"}" }]
        }
      })
    );

    expect(parsed.content).toBe("{\"intent\":\"SUPPORTIVE\"}");
  });

  it("adds strict JSON output instruction for classification prompts", () => {
    const prompt = buildCodexCliPrompt(
      [
        { role: "system", content: "Return intent JSON." },
        { role: "user", content: "힘든 하루였어." }
      ],
      "json"
    );

    expect(prompt).toContain("Return exactly one JSON object");
    expect(prompt).toContain("[SYSTEM]");
    expect(prompt).toContain("[USER]");
  });
});
