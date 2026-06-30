const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "/api/backend").replace(/\/$/, "")

export type BackendChatMode = "FAST" | "REALTIME"

export type BackendMessage = {
  id: string
  sender: "USER" | "GIRLFRIEND" | "SYSTEM"
  content: string
  messageType: string
  virtualDelayLabel: string | null
  createdAt: string
}

export type CreateRoomResponse = {
  roomId: string
  mode: BackendChatMode
  relationshipDay: number
  status: string
  girlfriend: {
    id: string
    name: string
    displayName: string
  }
}

export type SendMessageResponse = {
  result: string
  roomId?: string
  status?: string
  dueAt?: string
  messages?: BackendMessage[]
}

export async function createBackendRoom(input: {
  girlfriendId: string
  mode: BackendChatMode
}): Promise<CreateRoomResponse> {
  return requestJson<CreateRoomResponse>("/api/rooms", {
    method: "POST",
    body: JSON.stringify({
      userId: "frontend-demo-user",
      girlfriendId: input.girlfriendId,
      mode: input.mode,
    }),
  })
}

export async function sendBackendMessage(input: {
  roomId: string
  content: string
  mode: BackendChatMode
}): Promise<SendMessageResponse> {
  return requestJson<SendMessageResponse>(`/api/rooms/${input.roomId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      content: input.content,
      ...(input.mode === "FAST" ? { replyDelayChoice: "NOW" } : {}),
    }),
  })
}

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  })

  if (!response.ok) {
    const error = await readErrorMessage(response)
    throw new Error(error)
  }

  return (await response.json()) as T
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string; error?: string }
    return payload.message ?? payload.error ?? "요청에 실패했습니다."
  } catch {
    return "요청에 실패했습니다."
  }
}
