"use client"

import { useState } from "react"
import { IntroScreen } from "@/components/intro-screen"
import { CharacterSelection } from "@/components/character-selection"
import { GameLobby } from "@/components/game-lobby"
import { getReply, type Character } from "@/lib/characters"
import { demoJumpMinutes } from "@/lib/time"

export type TimeMode = "demo" | "real"
export type Screen = "selection" | "chat"

export type Message = {
  id: string
  sender: "user" | "ai"
  text: string
  /** epoch ms */
  timestamp: number
}

type ChatState = {
  messages: Message[]
  /** the current virtual clock for this character */
  virtualTime: number
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
    setSelectedCharacter(character)
    setCurrentScreen("chat")
    setChats((prev) => {
      if (prev[character.id]) return prev
      const now = Date.now()
      return {
        ...prev,
        [character.id]: {
          virtualTime: now,
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
  }

  function handleSend(text: string) {
    if (!selectedCharacter) return
    const id = selectedCharacter.id

    setChats((prev) => {
      const state = prev[id] ?? { messages: [], virtualTime: Date.now() }

      // 1) user message uses the current virtual time (demo) or real clock (real)
      const userTime = timeMode === "demo" ? state.virtualTime : Date.now()
      const userMsg: Message = {
        id: makeId(),
        sender: "user",
        text,
        timestamp: userTime,
      }

      // 2) compute the AI reply time
      const aiTime =
        timeMode === "demo" ? userTime + demoJumpMinutes() * 60_000 : Date.now()

      const turn = state.messages.filter((m) => m.sender === "user").length
      const aiMsg: Message = {
        id: makeId(),
        sender: "ai",
        text: getReply(id, turn),
        timestamp: aiTime,
      }

      return {
        ...prev,
        [id]: {
          virtualTime: timeMode === "demo" ? aiTime : Date.now(),
          messages: [...state.messages, userMsg, aiMsg],
        },
      }
    })
  }

  function handleBack() {
    setCurrentScreen("selection")
    setSelectedCharacter(null)
  }

  if (isIntroScreen) {
    return (
      <main className="animate-vn-fade-up">
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
