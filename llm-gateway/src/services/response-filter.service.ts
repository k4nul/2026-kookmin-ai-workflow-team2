import { env } from "../config/env.js";
import { BLOCKED_OUTPUT_PATTERNS } from "../config/blocked-output-patterns.js";

const leadingLabelPatterns = [/^\s*여자친구:\s*/i, /^\s*assistant:\s*/i, /^\s*AI:\s*/i];

export function trimToMaxOutputChars(content: string): string {
  return content.length > env.LLM_MAX_OUTPUT_CHARS
    ? content.slice(0, env.LLM_MAX_OUTPUT_CHARS)
    : content;
}

export function sanitizeLlmOutput(content: string): string {
  let sanitized = content.trim();

  if (isEntireResponseQuoted(sanitized)) {
    sanitized = sanitized.slice(1, -1).trim();
  }

  for (const labelPattern of leadingLabelPatterns) {
    sanitized = sanitized.replace(labelPattern, "");
  }

  return trimToMaxOutputChars(sanitized.trim());
}

export function containsInternalLeak(content: string): boolean {
  const normalizedContent = content.toLowerCase();

  return BLOCKED_OUTPUT_PATTERNS.some((pattern) =>
    normalizedContent.includes(pattern.toLowerCase())
  );
}

export function extractJsonObject(text: string): unknown | null {
  const withoutFence = stripMarkdownFence(text.trim());
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    return null;
  }

  try {
    return JSON.parse(withoutFence.slice(start, end + 1));
  } catch {
    return null;
  }
}

function isEntireResponseQuoted(content: string): boolean {
  if (content.length < 2) {
    return false;
  }

  const quotePairs: Array<[string, string]> = [
    ['"', '"'],
    ["'", "'"],
    ["`", "`"],
    ["“", "”"],
    ["‘", "’"]
  ];

  return quotePairs.some(([open, close]) => content.startsWith(open) && content.endsWith(close));
}

function stripMarkdownFence(text: string): string {
  const fenceMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : text;
}
