"use client"

import Image from "next/image"
import { Heart, Sparkles } from "lucide-react"

type Props = {
  onStart: () => void
}

export function IntroScreen({ onStart }: Props) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-between overflow-hidden">
      {/* Background illustration */}
      <Image
        src="/backgrounds/intro.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Romantic overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-rose-300/30 via-background/30 to-background/80" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,transparent,oklch(0.25_0.05_350/0.45))]" />

      {/* Top tag */}
      <div className="relative z-10 mt-12 flex items-center gap-1.5 rounded-full border border-card/40 bg-card/30 px-4 py-1.5 text-xs font-medium text-foreground backdrop-blur-md">
        <Sparkles className="size-3.5 text-primary" />
        Romance Visual Novel
      </div>

      {/* Title */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-3xl bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/40 backdrop-blur">
          <Heart className="size-8 fill-current" />
        </div>
        <p className="animate-vn-glow text-sm font-semibold uppercase tracking-[0.35em] text-primary-foreground">
          HeartLink AI
        </p>
        <h1 className="animate-vn-glow mt-2 text-balance font-heading text-5xl font-black leading-[1.05] tracking-tight text-card">
          Love Sweets
        </h1>
        <p className="mt-5 max-w-xs text-balance text-sm leading-relaxed text-card/90 [text-shadow:0_1px_4px_oklch(0.25_0.05_350/0.6)]">
          마음이 통하는 AI 상대와 시작하는 달콤한 연애 시뮬레이션
        </p>
      </div>

      {/* Start button */}
      <div className="relative z-10 mb-16 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onStart}
          className="animate-vn-pulse rounded-full bg-primary px-12 py-4 text-base font-bold tracking-wide text-primary-foreground shadow-xl shadow-primary/40 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-ring/50"
        >
          시작하기
        </button>
        <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-card/80">
          Press to Start
        </span>
      </div>
    </div>
  )
}
