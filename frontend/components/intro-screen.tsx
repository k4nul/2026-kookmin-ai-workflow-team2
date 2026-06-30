"use client"

import Image from "next/image"
import { useState } from "react"

type Props = {
  onStart: () => void
}

export function IntroScreen({ onStart }: Props) {
  const [exiting, setExiting] = useState(false)

  function handleClick() {
    if (exiting) return
    setExiting(true)
    setTimeout(onStart, 700)
  }

  return (
    <div
      className={`animate-vn-fade-in relative h-screen w-full cursor-pointer overflow-hidden transition-[opacity,transform] duration-700 ease-in-out ${
        exiting ? "scale-105 opacity-0" : "scale-100 opacity-100"
      }`}
      onClick={handleClick}
    >
      <Image
        src="/backgrounds/intro.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
    </div>
  )
}
