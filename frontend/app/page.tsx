"use client"

import { useState } from "react"
import { IntroScreen } from "@/components/intro-screen"
import { CharacterSelection } from "@/components/character-selection"
import { GameLobby } from "@/components/game-lobby"
import type { Character } from "@/lib/characters"
import {
  createBackendRoom,
  sendBackendMessage,
  type BackendChatMode,
  type BackendMessage,
} from "@/lib/backend-api"
import { demoJumpMinutes } from "@/lib/time"

export type TimeMode = "demo" | "real"
export type Screen = "selection" | "chat"

export type Message = {
  id: string
  sender: "user" | "ai" | "system"
  text: string
  /** epoch ms */
  timestamp: number
}

type ChatState = {
  roomId?: string
  mode: BackendChatMode
  messages: Message[]
  /** the current virtual clock for this character */
  virtualTime: number
  isConnecting: boolean
  isSending: boolean
  error?: string
}

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function Page() {
  const [isIntroScreen, setIsIntroScreen] = useState(true)
  const [currentScreen, setCurrentScreen] = useState<Screen>("selection")
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [timeMode, setTimeMode] = useState<TimeMode>("demo")
  const [chats, setChats] = useState<Record<string, ChatState>>({})

  function handleSelect(character: Character) {
    const mode = toBackendMode(timeMode)
    const existing = chats[character.id]

    setSelectedCharacter(character)
    setCurrentScreen("chat")

    if (existing?.mode === mode && (existing.roomId || existing.isConnecting)) {
      return
    }

    setChats((prev) => {
      const now = Date.now()
      return {
        ...prev,
        [character.id]: {
          mode,
          virtualTime: now,
          isConnecting: true,
          isSending: false,
          messages: [
            {
              id: makeId(),
              sender: "ai",
              text: character.greeting,
              timestamp: now,
            },
          ],
        },
      }
    })

    void ensureBackendRoom(character, mode)
  }

  async function ensureBackendRoom(character: Character, mode: BackendChatMode): Promise<string> {
    try {
      setChats((prev) => {
        const state = prev[character.id]
        if (!state || state.roomId) return prev

        return {
          ...prev,
          [character.id]: {
            ...state,
            isConnecting: true,
            error: undefined,
          },
        }
      })

      const room = await createBackendRoom({
        girlfriendId: character.backendGirlfriendId,
        mode,
      })

      setChats((prev) => {
        const state = prev[character.id]
        if (!state || state.mode !== mode) return prev

        return {
          ...prev,
          [character.id]: {
            ...state,
            roomId: room.roomId,
            isConnecting: false,
            error: undefined,
          },
        }
      })

      return room.roomId
    } catch (error) {
      setChats((prev) => {
        const state = prev[character.id]
        if (!state || state.mode !== mode) return prev

        return {
          ...prev,
          [character.id]: {
            ...state,
            isConnecting: false,
            error: getErrorMessage(error),
          },
        }
      })
      throw error
    }
  }

  async function handleSend(text: string) {
    if (!selectedCharacter) return
    const id = selectedCharacter.id
    const state = chats[id]

    if (!state || state.isConnecting || state.isSending) {
      setChats((prev) => {
        const current = prev[id]
        if (!current) return prev
        return {
          ...prev,
          [id]: {
            ...current,
            error: current.isConnecting ? "채팅방을 연결하는 중입니다." : "채팅방 연결이 필요합니다.",
          },
        }
      })
      return
    }

    let roomId = state.roomId
    if (!roomId) {
      try {
        roomId = await ensureBackendRoom(selectedCharacter, state.mode)
      } catch {
        return
      }
    }

    const userTime = state.mode === "FAST" ? state.virtualTime : Date.now()
    const replyStartTime = state.mode === "FAST" ? userTime + demoJumpMinutes() * 60_000 : Date.now()
    const userMsg: Message = {
      id: makeId(),
      sender: "user",
      text,
      timestamp: userTime,
    }

    setChats((prev) => {
      const current = prev[id]
      if (!current) return prev

      return {
        ...prev,
        [id]: {
          ...current,
          virtualTime: userTime,
          isSending: true,
          error: undefined,
          messages: [...current.messages, userMsg],
        },
      }
    })

    try {
      const result = await sendBackendMessage({
        roomId,
        content: text,
        mode: state.mode,
      })
      const responseMessages = (result.messages ?? []).map((message, index) =>
        fromBackendMessage(message, state.mode === "FAST" ? replyStartTime + index * 60_000 : undefined),
      )
      const pendingMessage =
        responseMessages.length === 0 && result.dueAt
          ? [
              {
                id: makeId(),
                sender: "system" as const,
                text: "답장을 기다리는 중이에요.",
                timestamp: Date.now(),
              },
            ]
          : []
      const nextMessages = [...responseMessages, ...pendingMessage]

      setChats((prev) => {
        const current = prev[id]
        if (!current) return prev

        const lastMessage = nextMessages.length > 0 ? nextMessages[nextMessages.length - 1] : null

        return {
          ...prev,
          [id]: {
            ...current,
            virtualTime: state.mode === "FAST" ? lastMessage?.timestamp ?? replyStartTime : Date.now(),
            isSending: false,
            messages: [...current.messages, ...nextMessages],
          },
        }
      })
    } catch (error) {
      setChats((prev) => {
        const current = prev[id]
        if (!current) return prev

        return {
          ...prev,
          [id]: {
            ...current,
            isSending: false,
            error: getErrorMessage(error),
          },
        }
      })
    }
  }

  function fromBackendMessage(message: BackendMessage, timestamp?: number): Message {
    return {
      id: message.id,
      sender: message.sender === "USER" ? "user" : message.sender === "SYSTEM" ? "system" : "ai",
      text: message.content,
      timestamp: timestamp ?? new Date(message.createdAt).getTime(),
    }
  }

  function toBackendMode(mode: TimeMode): BackendChatMode {
    return mode === "demo" ? "FAST" : "REALTIME"
  }

  function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "요청에 실패했습니다."
  }

  function handleBack() {
    setCurrentScreen("selection")
    setSelectedCharacter(null)
  }

  if (isIntroScreen) {
    return (
      <main>
        <IntroScreen onStart={() => setIsIntroScreen(false)} />
      </main>
    )
  }

  if (currentScreen === "chat" && selectedCharacter) {
    const state = chats[selectedCharacter.id]
    return (
      <main className="animate-vn-fade-up">
        <GameLobby
          character={selectedCharacter}
          messages={state?.messages ?? []}
          timeMode={timeMode}
          virtualTime={new Date(state?.virtualTime ?? Date.now())}
          isConnecting={state?.isConnecting ?? false}
          isSending={state?.isSending ?? false}
          connectionError={state?.error}
          onBack={handleBack}
          onSend={handleSend}
        />
      </main>
    )
  }

  return (
    <GameFrame>
      <main className="animate-vn-fade-up mx-auto w-full max-w-lg">
        <CharacterSelection
          timeMode={timeMode}
          onTimeModeChange={setTimeMode}
          onSelect={handleSelect}
        />
      </main>
    </GameFrame>
  )
}

/** Immersive romantic backdrop shared by the selection and chat screens. */
function GameFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-[radial-gradient(circle_at_20%_10%,oklch(0.94_0.05_350),transparent_55%),radial-gradient(circle_at_85%_90%,oklch(0.92_0.05_320),transparent_55%),linear-gradient(to_bottom,oklch(0.98_0.01_350),oklch(0.95_0.03_340))]">
      {/* subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.4] [background-image:linear-gradient(oklch(0.7_0.16_0/0.06)_1px,transparent_1px),linear-gradient(90deg,oklch(0.7_0.16_0/0.06)_1px,transparent_1px)] [background-size:28px_28px]"
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
