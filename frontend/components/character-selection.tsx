"use client"

import Image from "next/image"
import { Heart, Zap, Clock, Info, Sparkles } from "lucide-react"
import { characters, type Character } from "@/lib/characters"
import type { TimeMode } from "@/app/page"
import { cn } from "@/lib/utils"

type Props = {
  timeMode: TimeMode
  onTimeModeChange: (mode: TimeMode) => void
  onSelect: (character: Character) => void
}

export function CharacterSelection({ timeMode, onTimeModeChange, onSelect }: Props) {
  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-10">
      {/* Header */}
      <header className="mb-7 flex flex-col items-center text-center">
        <div className="mb-3 flex size-14 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/40">
          <Heart className="size-7 fill-current" />
        </div>
        <h1 className="text-pretty font-heading text-3xl font-black tracking-tight text-foreground [text-shadow:0_1px_10px_oklch(0.7_0.16_0/0.25)]">
          상대를 선택하세요
        </h1>
        <p className="mt-2 max-w-xs text-balance text-sm leading-relaxed text-muted-foreground">
          마음이 통하는 AI 상대와 설레는 대화를 시작해보세요
        </p>
      </header>

      {/* Time mode toggle — premium pill slider */}
      <section className="mb-5 w-full max-w-md">
        <div className="relative grid grid-cols-2 rounded-full border border-primary/20 bg-card/70 p-1.5 shadow-lg shadow-primary/10 backdrop-blur-md">
          {/* sliding thumb */}
          <span
            aria-hidden
            className={cn(
              "absolute inset-y-1.5 w-[calc(50%-0.375rem)] rounded-full bg-primary shadow-md shadow-primary/40 transition-transform duration-300 ease-out",
              timeMode === "demo" ? "translate-x-0" : "translate-x-[calc(100%+0.75rem)]",
            )}
          />
          <ModeButton
            active={timeMode === "demo"}
            onClick={() => onTimeModeChange("demo")}
            icon={<Zap className="size-4" />}
            label="데모 모드"
          />
          <ModeButton
            active={timeMode === "real"}
            onClick={() => onTimeModeChange("real")}
            icon={<Clock className="size-4" />}
            label="실제 모드"
          />
        </div>
      </section>

      {/* Framed hint box */}
      <section className="mb-7 w-full max-w-md">
        <div className="flex items-start gap-2.5 rounded-2xl border border-primary/20 bg-pink-50/80 px-4 py-3 text-xs leading-relaxed text-secondary-foreground shadow-sm backdrop-blur-md">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            {timeMode === "demo"
              ? "데모 모드: 답장마다 가상 시간이 20~30분씩 빠르게 흘러가 관계가 빠르게 진전됩니다."
              : "실제 모드: 메시지 시간이 실제 시계와 똑같이 동기화되어 현실처럼 대화합니다."}
          </p>
        </div>
      </section>

      {/* Character grid */}
      <section className="w-full max-w-md">
        <div className="mb-3 flex items-center gap-1.5 px-1">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">캐릭터</h2>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          {characters.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c)}
              className="group overflow-hidden rounded-3xl border border-primary/30 bg-card/80 text-left shadow-lg shadow-primary/10 ring-1 ring-card/50 backdrop-blur-md transition-all hover:-translate-y-1.5 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className={cn("relative aspect-square w-full bg-gradient-to-br", c.accent)}>
                <Image
                  src={c.avatar || "/placeholder.svg"}
                  alt={`${c.name} 프로필 이미지`}
                  fill
                  sizes="(max-width: 768px) 50vw, 220px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent" />
                <span className="absolute left-2.5 top-2.5 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-semibold text-primary backdrop-blur">
                  {c.tagline}
                </span>
              </div>
              <div className="p-3">
                <h3 className="font-heading text-base font-bold text-foreground">{c.name}</h3>
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {c.personality}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <p className="mt-8 text-center text-[11px] text-muted-foreground">
        프로토타입 데모 · 모든 대화는 가상입니다
      </p>
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative z-10 flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-semibold transition-colors",
        active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
