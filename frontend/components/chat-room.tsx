"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ArrowLeft, Send, Zap, Clock } from "lucide-react"
import type { Character } from "@/lib/characters"
import { getTimelinePhase } from "@/lib/characters"
import { formatKoreanTime } from "@/lib/time"
import type { Message, TimeMode } from "@/app/page"
import { cn } from "@/lib/utils"

type Props = {
  character: Character
  messages: Message[]
  timeMode: TimeMode
  virtualTime: Date
  isConnecting: boolean
  isSending: boolean
  connectionError?: string
  onBack: () => void
  onSend: (text: string) => void
}

export function ChatRoom({
  character,
  messages,
  timeMode,
  virtualTime,
  isConnecting,
  isSending,
  connectionError,
  onBack,
  onSend,
}: Props) {
  const [draft, setDraft] = useState("")
  const composingRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isBusy = isConnecting || isSending

  const phase = getTimelinePhase(messages.length)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isSending])

  function handleSend() {
    const text = draft.trim()
    if (!text || isBusy) return
    setDraft("")
    onSend(text)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !composingRef.current &&
      e.nativeEvent.isComposing !== true &&
      e.keyCode !== 229
    ) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card/60">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-primary/20 bg-card/85 px-3 py-2.5 backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          aria-label="로비로 나가기"
          className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 py-1.5 text-[11px] font-bold text-secondary-foreground transition-colors hover:bg-primary/15"
        >
          <ArrowLeft className="size-3.5" />
          나가기
        </button>
        <div className="relative size-10 overflow-hidden rounded-full ring-2 ring-primary/20">
          <Image
            src={character.avatar || "/placeholder.svg"}
            alt={`${character.name} 프로필 이미지`}
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-bold text-foreground">{character.name}</h2>
          <p className="truncate text-xs text-muted-foreground">{character.tagline}</p>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {phase}
        </span>
      </header>

      {/* Virtual time banner */}
      <div className="flex items-center justify-center gap-1.5 border-b border-border bg-secondary/60 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
        {timeMode === "demo" ? (
          <Zap className="size-3 text-primary" />
        ) : (
          <Clock className="size-3 text-primary" />
        )}
        <span>
          {timeMode === "demo" ? "데모 시간" : "실제 시간"} · {formatVirtual(virtualTime)}
        </span>
      </div>
      {connectionError && (
        <div className="border-b border-destructive/20 bg-destructive/10 px-3 py-1.5 text-center text-[11px] font-medium text-destructive">
          {connectionError}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto">
        <Image
          src="/backgrounds/classroom.png"
          alt=""
          fill
          sizes="448px"
          className="pointer-events-none object-cover opacity-30"
        />
        <div className="pointer-events-none absolute inset-0 bg-background/40" />
        <div className="relative space-y-3 px-3 py-4">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} character={character} />
          ))}
          {isSending && <TypingBubble character={character} />}
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 border-t border-primary/20 bg-card/85 px-3 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => (composingRef.current = true)}
            onCompositionEnd={() => (composingRef.current = false)}
            disabled={isConnecting}
            placeholder={isConnecting ? "채팅방 연결 중..." : `${character.name}에게 메시지 보내기...`}
            aria-label="메시지 입력"
            className="h-11 flex-1 rounded-full border border-border bg-background px-4 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim() || isBusy}
            aria-label="전송"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:opacity-40"
          >
            <Send className="size-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message, character }: { message: Message; character: Character }) {
  if (message.sender === "system") {
    return (
      <div className="flex justify-center">
        <div className="max-w-[82%] rounded-full bg-background/80 px-3 py-1.5 text-center text-[11px] font-medium text-muted-foreground shadow-sm">
          {message.text}
        </div>
      </div>
    )
  }

  const isUser = message.sender === "user"
  return (
    <div className={cn("flex items-end gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="relative size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
          <Image
            src={character.avatar || "/placeholder.svg"}
            alt=""
            fill
            sizes="32px"
            className="object-cover"
          />
        </div>
      )}
      <div className={cn("flex max-w-[75%] items-end gap-1.5", isUser && "flex-row-reverse")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm",
            isUser
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md bg-card text-card-foreground",
          )}
        >
          {message.text}
        </div>
        <time className="mb-0.5 shrink-0 text-[10px] text-muted-foreground">
          {formatKoreanTime(new Date(message.timestamp))}
        </time>
      </div>
    </div>
  )
}

function TypingBubble({ character }: { character: Character }) {
  return (
    <div className="flex items-end gap-2">
      <div className="relative size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
        <Image src={character.avatar || "/placeholder.svg"} alt="" fill sizes="32px" className="object-cover" />
      </div>
      <div className="rounded-2xl rounded-bl-md bg-card px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          <Dot delay="0ms" />
          <Dot delay="150ms" />
          <Dot delay="300ms" />
        </div>
      </div>
    </div>
  )
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
      style={{ animationDelay: delay }}
    />
  )
}

function formatVirtual(date: Date): string {
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}월 ${day}일 ${formatKoreanTime(date)}`
}
