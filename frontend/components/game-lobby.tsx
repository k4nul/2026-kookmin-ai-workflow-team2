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

      {/* Title */}
      <header className="relative z-10 flex items-center justify-center px-4 pt-4 pb-2">
        <h1 className="text-balance text-center text-lg font-black tracking-tight md:text-xl">
          <span className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" style={{ color: "#ff6eb4" }}>
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

      {/* Main — 3-column: [left w-52] [phone auto] [right w-52]
          양쪽이 같은 고정폭이므로 폰이 항상 정중앙에 위치 */}
      <main className="relative z-10 flex flex-1 items-center justify-center gap-4 overflow-hidden px-4 py-3">

        {/* LEFT: 캐릭터 정보 카드 (데스크톱 전용, 우측 스탠디와 동일 폭으로 균형) */}
        <aside className="hidden w-52 shrink-0 flex-col items-stretch gap-3 lg:flex">
          <CharacterInfoCard character={character} />
        </aside>

        {/* CENTER: 폰 프레임 — 항상 그룹의 중심 */}
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

        {/* RIGHT: 캐릭터 스탠디 — 폰 바로 옆, 동일 폭 w-52 */}
        <aside className="hidden w-52 shrink-0 flex-col items-center justify-end lg:flex">
          <CharacterStandee character={character} />
        </aside>
      </main>

      {/* 하단 — 홈 버튼만 */}
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

/* ─── 좌측: 캐릭터 정보 카드 ─────────────────────────── */

function CharacterInfoCard({ character }: { character: Character }) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-card/80 p-4 shadow-lg backdrop-blur-md">
      {/* 아바타 + 이름 */}
      <div className="mb-3 flex items-center gap-2.5">
        <div className="relative size-11 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/30">
          <Image
            src={character.avatar || "/placeholder.svg"}
            alt={character.name}
            fill
            sizes="44px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-foreground">{character.name}</p>
          <p className="truncate text-xs text-muted-foreground">{character.tagline}</p>
        </div>
      </div>

      {/* 성격 설명 */}
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        {character.personality}
      </p>

      {/* 오라 배지 */}
      <div
        className="rounded-full border px-3 py-1 text-center text-[10px] font-bold"
        style={{
          borderColor: character.glow,
          color: character.glow,
          backgroundColor: `${character.glow}18`,
        }}
      >
        {character.aura}
      </div>
    </div>
  )
}

/* ─── 중앙: 폰 프레임 ────────────────────────────────── */

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full w-full">
      {/* 글로우 */}
      <div className="absolute -inset-2 rounded-[2.75rem] bg-gradient-to-b from-primary/30 to-fuchsia-400/20 blur-xl" />
      <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] border-[6px] border-foreground/85 bg-foreground/90 shadow-2xl">
        {/* 노치 */}
        <div className="absolute left-1/2 top-0 z-20 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-foreground/85" />
        {/* 스크린 — pt-5 로 노치 아래부터 콘텐츠 시작 */}
        <div className="absolute inset-0 overflow-hidden rounded-[2rem] bg-background pt-5">
          {children}
        </div>
      </div>
    </div>
  )
}

/* ─── 우측: 캐릭터 스탠디 ────────────────────────────── */

function CharacterStandee({ character }: { character: Character }) {
  return (
    /* w-full: 부모 w-52 에 꽉 차게. aspect-[3/5]로 비율 유지 */
    <div className="relative w-full">
      {/* 오라 글로우 */}
      <div
        className="absolute -bottom-2 left-1/2 size-40 -translate-x-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: character.glow, opacity: 0.45 }}
      />

      {/* 카드 */}
      <div
        className="relative w-full overflow-hidden rounded-[1.5rem] border-2 shadow-2xl"
        style={{
          aspectRatio: "3 / 5",
          borderColor: character.glow,
          boxShadow: `0 0 32px ${character.glow}55`,
        }}
      >
        <Image
          src={character.standee || "/placeholder.svg"}
          alt={`${character.name} 캐릭터 일러스트`}
          fill
          sizes="208px"
          className="object-cover object-top"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />

        {/* 이름 태그 */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-card/40 bg-card/85 px-3 py-1.5 text-center shadow-lg backdrop-blur-md">
          <p className="text-sm font-black text-foreground">{character.name}</p>
          <p className="text-[10px] font-bold" style={{ color: character.glow }}>
            {character.aura}
          </p>
        </div>
      </div>
    </div>
  )
}
