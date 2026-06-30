import { randomUUID } from "node:crypto";

export function ensureRequestId(requestId?: string): string {
  return requestId?.trim() ? requestId : `req_${randomUUID()}`;
}
