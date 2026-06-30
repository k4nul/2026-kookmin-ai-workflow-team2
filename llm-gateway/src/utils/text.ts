import type { ChatMessage } from "../types/dto.js";

export function getTotalMessageContentLength(messages: ChatMessage[]): number {
  return messages.reduce((sum, message) => sum + message.content.length, 0);
}
