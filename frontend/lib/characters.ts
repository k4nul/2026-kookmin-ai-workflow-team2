export type Character = {
  id: string
  backendGirlfriendId: string
  name: string
  tagline: string
  personality: string
  avatar: string
  /** full-body standee shown in the lobby right column */
  standee: string
  /** tailwind gradient classes for the card accent */
  accent: string
  /** neon glow color (CSS color) used for the standee aura */
  glow: string
  /** short aura label shown on the standee tag */
  aura: string
  /** opening message shown when chat starts */
  greeting: string
}

export const characters: Character[] = [
  {
    id: "minji",
    backendGirlfriendId: "gf_minseo",
    name: "민지",
    tagline: "Sweet & bubbly",
    personality: "다정하고 애교 많은 성격 · 이모지를 자주 써요",
    avatar: "/characters/minji.png",
    standee: "/standees/minji.png",
    accent: "from-pink-200 to-rose-100",
    glow: "oklch(0.72 0.18 350)",
    aura: "Pink Aura ⭐",
    greeting: "안녕~ 드디어 너랑 얘기하게 됐다! 💕 오늘 하루 어땠어? 😊",
  },
  {
    id: "dohyun",
    backendGirlfriendId: "gf_jiyoon",
    name: "도현",
    tagline: "Tsundere",
    personality: "퉁명스럽지만 속은 다정한 츤데레",
    avatar: "/characters/dohyun.png",
    standee: "/standees/dohyun.png",
    accent: "from-sky-200 to-indigo-100",
    glow: "oklch(0.62 0.2 290)",
    aura: "Purple Aura ⭐",
    greeting: "...왔어? 뭐, 딱히 기다린 건 아니고. 그냥 심심하던 차에.",
  },
  {
    id: "seowoo",
    backendGirlfriendId: "gf_seoa",
    name: "서우",
    tagline: "Mature & elegant",
    personality: "성숙하고 예의 바르며 차분한 성격",
    avatar: "/characters/seowoo.png",
    standee: "/standees/seowoo.png",
    accent: "from-amber-100 to-rose-100",
    glow: "oklch(0.74 0.14 60)",
    aura: "Amber Aura ⭐",
    greeting: "안녕하세요. 이렇게 대화를 나누게 되어 기뻐요. 편하게 이야기해요.",
  },
  {
    id: "hayoon",
    backendGirlfriendId: "gf_harin",
    name: "하윤",
    tagline: "Chaotic & fun",
    personality: "엉뚱하고 에너지 넘치는 활기찬 성격",
    avatar: "/characters/hayoon.png",
    standee: "/standees/hayoon.png",
    accent: "from-fuchsia-200 to-pink-100",
    glow: "oklch(0.68 0.24 330)",
    aura: "Fuchsia Aura ⭐",
    greeting: "야야야!! 드디어 왔다 ㅋㅋㅋ 우리 뭐하고 놀까?? 🎉🔥",
  },
]

/** message count -> human friendly timeline phase label */
export function getTimelinePhase(messageCount: number): string {
  const pairs = Math.floor(messageCount / 2)
  if (pairs < 3) return "1일차"
  if (pairs < 6) return "3일차"
  if (pairs < 10) return "1주차"
  if (pairs < 16) return "2주차"
  if (pairs < 24) return "1개월차"
  return "연인 사이 ❤️"
}
