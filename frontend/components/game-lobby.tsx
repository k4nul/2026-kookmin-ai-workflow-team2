"use client"

import Image from "next/image"
import { Home } from "lucide-react"
import { ChatRoom } from "@/components/chat-room"
import type { Character } from "@/lib/characters"
import type { Message, TimeMode } from "@/app/page"

type Props = {
  character: Character
  messages: Message[]
  timeMode: TimeMode
  virtualTime: Date
  onBack: () => void
  onSend: (text: string) => void
}

export function GameLobby({
  character,
  messages,
  timeMode,
  virtualTime,
  onBack,
  onSend,
}: Props) {
  return (
    <div
      className="relative flex min-h-dvh w-full flex-col overflow-hidden"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Background */}
      <Image
        src="/backgrounds/lobby.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-background/40 to-background/70 backdrop-blur-sm" />

      {/* Title banner */}
      <header className="relative z-10 flex items-center justify-center px-4 pt-4 pb-2">
        <h1 className="text-balance text-center text-lg font-black tracking-tight md:text-xl">
          <span
            className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
            style={{ color: "#ff6eb4" }}
          >
            메챠 야바이!
          </span>
          <span className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            {" "}금지어 러브채팅
          </span>
          <span className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" style={{ color: "#e879f9" }}>
            ⭐
          </span>
        </h1>
      </header>

      {/* Main area */}
      <main className="relative z-10 flex flex-1 items-center justify-center overflow-hidden px-3 py-3 lg:gap-4 lg:px-6">
        {/* Phone: height = min(available vertical space, width×19/9) — always fits screen */}
        <div
          className="relative shrink-0"
          style={{
            height: "min(calc(100svh - 9rem), calc(100vw * 19 / 9))",
            aspectRatio: "9 / 19",
          }}
        >
          <PhoneFrame>
            <ChatRoom
              character={character}
              messages={messages}
              timeMode={timeMode}
              virtualTime={virtualTime}
              onBack={onBack}
              onSend={onSend}
            />
          </PhoneFrame>
        </div>

        {/* RIGHT — character standee (desktop only) */}
        <aside className="hidden flex-1 items-end justify-center lg:flex">
          <CharacterStandee character={character} />
        </aside>
      </main>

      {/* Bottom nav — 홈 버튼만 */}
      <nav
        className="relative z-10 flex items-center justify-center border-t border-primary/20 bg-card/80 px-2 py-2 backdrop-blur-md"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex flex-col items-center gap-0.5 rounded-xl px-8 py-1.5 text-[11px] font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          <Home className="size-5" />
          홈
        </button>
      </nav>
    </div>
  )
}

/* ---------- Phone shell ---------- */

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full w-full">
      {/* glow */}
      <div className="absolute -inset-2 rounded-[2.75rem] bg-gradient-to-b from-primary/30 to-fuchsia-400/20 blur-xl" />
      <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] border-[6px] border-foreground/85 bg-foreground/90 shadow-2xl">
        {/* notch */}
        <div className="absolute left-1/2 top-0 z-20 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-foreground/85" />
        {/* screen — pt-5 pushes content below the notch */}
        <div className="absolute inset-0 overflow-hidden rounded-[2rem] bg-background pt-5">
          {children}
        </div>
      </div>
    </div>
  )
}

/* ---------- Character standee (desktop) ---------- */

function CharacterStandee({ character }: { character: Character }) {
  return (
    <div className="relative flex h-full max-h-[70vh] w-full max-w-md flex-col items-center justify-end">
      <div
        className="absolute bottom-10 left-1/2 size-72 -translate-x-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: character.glow, opacity: 0.4 }}
      />
      <div
        className="relative aspect-[3/5] w-full overflow-hidden rounded-[2rem] border-2 shadow-2xl"
        style={{ borderColor: character.glow, boxShadow: `0 0 40px ${character.glow}55` }}
      >
        <Image
          src={character.standee || "/placeholder.svg"}
          alt={`${character.name} 캐릭터 일러스트`}
          fill
          sizes="(min-width:1024px) 28rem, 0px"
          className="object-cover object-top"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-2xl border border-card/40 bg-card/85 px-5 py-2 text-center shadow-lg backdrop-blur-md">
          <p className="text-base font-black text-foreground">{character.name}</p>
          <p className="text-[11px] font-bold" style={{ color: character.glow }}>
            {character.aura}
          </p>
        </div>
      </div>
    </div>
  )
}
