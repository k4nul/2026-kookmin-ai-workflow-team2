"use client"

import Image from "next/image"
import { useCallback, useEffect, useMemo, useState } from "react"

type Props = {
  onStart: () => void
}

type Scene = {
  id: string
  image: string
  speaker: string
  text: string
  durationMs: number
  objectPosition?: string
}

const openingScenes: Scene[] = [
  {
    id: "dark-room",
    image: "/opening/01-dark-room.png",
    speaker: "소봉이",
    text: "나는 23년째 모태솔로였다. 오늘도 아무 일 없이 끝날 줄 알았다.",
    durationMs: 4200,
    objectPosition: "50% 12%",
  },
  {
    id: "rain-street",
    image: "/opening/02-rain-street.png",
    speaker: "소봉이",
    text: "그날 밤, 빗속 도로 위로 낯선 불빛이 번져 왔다.",
    durationMs: 4700,
  },
  {
    id: "truck",
    image: "/opening/03-truck.png",
    speaker: "소봉이",
    text: "눈앞을 가른 빛과 굉음이 모든 생각을 삼켜 버렸다.",
    durationMs: 4300,
  },
  {
    id: "fall",
    image: "/opening/04-fall.png",
    speaker: "소봉이",
    text: "다시 눈을 떴을 때, 나를 걱정하는 네 명의 메시지가 도착해 있었다.",
    durationMs: 5200,
  },
]

export function IntroScreen({ onStart }: Props) {
  const [started, setStarted] = useState(false)
  const [sceneIndex, setSceneIndex] = useState(0)
  const [typedLength, setTypedLength] = useState(0)
  const [exiting, setExiting] = useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()
  const scene = openingScenes[sceneIndex]
  const visibleTextLength = prefersReducedMotion ? scene.text.length : typedLength
  const typedText = useMemo(
    () => scene.text.slice(0, visibleTextLength),
    [scene.text, visibleTextLength],
  )
  const isLastScene = sceneIndex === openingScenes.length - 1

  const finishOpening = useCallback(() => {
    if (exiting) return
    setExiting(true)
    window.setTimeout(onStart, prefersReducedMotion ? 0 : 500)
  }, [exiting, onStart, prefersReducedMotion])

  const advance = useCallback(() => {
    if (visibleTextLength < scene.text.length) {
      setTypedLength(scene.text.length)
      return
    }

    if (isLastScene) {
      finishOpening()
      return
    }

    setSceneIndex((current) => current + 1)
  }, [finishOpening, isLastScene, scene.text.length, visibleTextLength])

  useEffect(() => {
    if (!started) return

    setTypedLength(prefersReducedMotion ? scene.text.length : 0)
  }, [prefersReducedMotion, scene.text.length, sceneIndex, started])

  useEffect(() => {
    if (!started || prefersReducedMotion || typedLength >= scene.text.length) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setTypedLength((current) => Math.min(current + 1, scene.text.length))
    }, 36)

    return () => window.clearTimeout(timeoutId)
  }, [prefersReducedMotion, scene.text.length, started, typedLength])

  useEffect(() => {
    if (!started) return undefined

    const timeoutId = window.setTimeout(advance, scene.durationMs)
    return () => window.clearTimeout(timeoutId)
  }, [advance, scene.durationMs, started])

  useEffect(() => {
    if (!started) return undefined

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        finishOpening()
        return
      }

      if (
        (event.key === "Enter" || event.key === " ") &&
        !(event.target instanceof HTMLButtonElement)
      ) {
        event.preventDefault()
        advance()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [advance, finishOpening, started])

  if (!started) {
    return (
      <section
        aria-label="게임 시작 화면"
        className="relative min-h-dvh w-full overflow-hidden bg-background"
      >
        <button
          type="button"
          onClick={() => setStarted(true)}
          aria-label="오프닝 시작"
          className="group absolute inset-0 cursor-pointer bg-transparent focus-visible:outline-4 focus-visible:-outline-offset-8 focus-visible:outline-primary"
        >
          <Image
            src="/backgrounds/intro.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02] motion-reduce:transition-none"
          />
        </button>
      </section>
    )
  }

  return (
    <section
      aria-label="게임 오프닝"
      className={`relative min-h-dvh w-full overflow-hidden bg-background transition-opacity duration-500 motion-reduce:transition-none ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
    >
      <button
        type="button"
        onClick={advance}
        aria-label={
          visibleTextLength < scene.text.length
            ? "대사 전체 보기"
            : isLastScene
              ? "오프닝 종료"
              : "다음 장면 보기"
        }
        className="absolute inset-0 z-30 cursor-pointer bg-transparent focus-visible:outline-4 focus-visible:-outline-offset-8 focus-visible:outline-primary"
      />
      <Image
        src={scene.image}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover motion-safe:animate-vn-fade-in"
        style={{ objectPosition: scene.objectPosition ?? "center" }}
      />
      <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-background/10 via-background/20 to-background/80" />
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          finishOpening()
        }}
        className="absolute right-4 top-4 z-40 rounded-full border border-card/50 bg-card/75 px-4 py-2 text-sm font-black text-foreground shadow-lg backdrop-blur-md transition-colors hover:bg-card focus-visible:outline-4 focus-visible:outline-primary"
      >
        스킵하기
      </button>
      <div className="pointer-events-none absolute inset-x-4 bottom-6 z-30 mx-auto max-w-3xl rounded-3xl border border-card/60 bg-card/90 px-5 pb-5 pt-8 shadow-2xl backdrop-blur-md md:bottom-10 md:px-8 md:pb-7 md:pt-10">
        <div className="absolute -top-5 left-5 rounded-full bg-primary px-5 py-2 text-sm font-black text-primary-foreground shadow-lg md:left-8">
          {scene.speaker}
        </div>
        <p className="min-h-16 text-pretty text-lg font-bold leading-relaxed text-card-foreground md:text-2xl">
          {typedText}
          <span
            aria-hidden
            className="ml-1 inline-block h-5 w-2 translate-y-1 animate-pulse bg-primary motion-reduce:hidden md:h-7"
          />
        </p>
      </div>
    </section>
  )
}

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return prefersReducedMotion
}
