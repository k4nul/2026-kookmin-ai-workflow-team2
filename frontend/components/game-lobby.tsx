"use client"

import Image from "next/image"
import {
  Heart,
  Gem,
  Shirt,
  BookOpen,
  HeartHandshake,
  Camera,
  ShoppingBag,
  Home,
  Users,
  MessageCircle,
  Radio,
  ClipboardList,
  Sparkles,
} from "lucide-react"
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

const sideMenu = [
  { label: "의상", icon: Shirt },
  { label: "스토리", icon: BookOpen },
  { label: "호감도", icon: HeartHandshake },
  { label: "포토", icon: Camera },
  { label: "상점", icon: ShoppingBag },
]

const bottomMenu = [
  { label: "홈", icon: Home },
  { label: "캐릭터", icon: Users },
  { label: "커뮤니티", icon: MessageCircle },
  { label: "라이브", icon: Radio },
  { label: "업무", icon: ClipboardList },
  { label: "뽑기", icon: Sparkles },
]

export function GameLobby({
  character,
  messages,
  timeMode,
  virtualTime,
  onBack,
  onSend,
}: Props) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-hidden">
      {/* Immersive blurred lobby background */}
      <Image
        src="/backgrounds/lobby.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/20 via-background/40 to-background/70 backdrop-blur-sm" />

      {/* Title banner */}
      <header className="relative z-10 flex items-center justify-center px-4 pt-4 pb-2">
        <h1 className="text-balance text-center text-lg font-black tracking-tight text-foreground drop-shadow-sm md:text-xl">
          <span className="text-primary">메챠 야바이!</span> 금지어 러브채팅
          <span className="text-fuchsia-500">⭐</span>
        </h1>
      </header>

      {/* Main 3-column area */}
      <main className="relative z-10 flex flex-1 items-stretch justify-center gap-4 px-3 pb-3 md:px-6">
        {/* LEFT COLUMN — menus & mascot */}
        <aside className="hidden w-60 shrink-0 flex-col gap-3 lg:flex">
          <PlayerStatusBar />
          <MascotBox />
          <nav className="flex flex-col gap-2 rounded-2xl border border-primary/20 bg-pink-50/80 p-3 shadow-lg backdrop-blur-md">
            {sideMenu.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                className="flex items-center gap-3 rounded-xl bg-card/70 px-4 py-2.5 text-sm font-bold text-card-foreground shadow-sm transition-all hover:scale-[1.02] hover:bg-primary hover:text-primary-foreground"
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* CENTER COLUMN — smartphone chat frame */}
        <div className="flex w-full max-w-sm items-center justify-center">
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

        {/* RIGHT COLUMN — character standee */}
        <aside className="hidden flex-1 items-end justify-center lg:flex">
          <CharacterStandee character={character} />
        </aside>
      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className="relative z-10 flex items-center justify-around border-t border-primary/20 bg-card/80 px-2 py-2 backdrop-blur-md">
        {bottomMenu.map(({ label, icon: Icon }, i) => (
          <button
            key={label}
            type="button"
            className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-colors ${
              i === 1
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}

/* ---------- Left column pieces ---------- */

function PlayerStatusBar() {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-card/80 p-2.5 shadow-lg backdrop-blur-md">
      <div className="relative size-9 overflow-hidden rounded-full ring-2 ring-primary/30">
        <Image src="/characters/minji.png" alt="플레이어" fill sizes="36px" className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <Heart className="size-3.5 fill-primary text-primary" />
          <span>100</span>
          <span className="text-muted-foreground">/100</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <Gem className="size-3.5 fill-sky-400 text-sky-500" />
          <span>5,630</span>
        </div>
      </div>
      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-black text-primary">
        Lv.7
      </span>
    </div>
  )
}

function MascotBox() {
  return (
    <div className="rounded-2xl border border-primary/20 bg-pink-50/80 p-3 shadow-lg backdrop-blur-md">
      <div className="mb-2 rounded-2xl rounded-bl-sm border border-primary/15 bg-card/90 px-3 py-2 text-xs font-medium leading-relaxed text-card-foreground shadow-sm">
        오늘도 두근두근한 채팅 시작해볼까? 화이팅! ⭐
      </div>
      <div className="flex items-center gap-3">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-200 to-fuchsia-200 text-3xl shadow-inner ring-1 ring-primary/20">
          🐰
        </div>
        <div>
          <p className="text-sm font-black text-foreground">소봉이</p>
          <p className="text-[11px] text-muted-foreground">너의 큐피드 마스코트</p>
        </div>
      </div>
    </div>
  )
}

/* ---------- Center phone shell ---------- */

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full">
      {/* glow */}
      <div className="absolute -inset-2 rounded-[2.75rem] bg-gradient-to-b from-primary/30 to-fuchsia-400/20 blur-xl" />
      <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[2.5rem] border-[6px] border-foreground/85 bg-foreground/90 shadow-2xl">
        {/* notch */}
        <div className="absolute left-1/2 top-0 z-20 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-foreground/85" />
        {/* screen */}
        <div className="absolute inset-0 overflow-hidden rounded-[2rem] bg-background">
          {children}
        </div>
      </div>
    </div>
  )
}

/* ---------- Right standee ---------- */

function CharacterStandee({ character }: { character: Character }) {
  return (
    <div className="relative flex h-full max-h-[70vh] w-full max-w-md flex-col items-center justify-end">
      {/* neon aura */}
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
        {/* name + aura tag */}
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
