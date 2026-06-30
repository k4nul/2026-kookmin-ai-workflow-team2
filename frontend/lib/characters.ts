export type Character = {
  id: string
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

const replyPools: Record<string, string[]> = {
  minji: [
    "정말?? 너무 좋다 💕 더 얘기해줘~ 😊",
    "헤헤 너랑 얘기하면 기분이 좋아져 🥰",
    "보고 싶었어... 😳 오늘 뭐 했어?",
    "우와 진짜?! 완전 멋지다 ✨ 자랑스러워!",
    "있잖아, 다음엔 우리 같이 뭐 할까? 💗",
  ],
  dohyun: [
    "흥, 그게 뭐 대단한 거라고. ...그래도 나쁘진 않네.",
    "딱히 신경 쓴 건 아니지만... 밥은 먹었어?",
    "너 진짜 가끔 보면 답이 없다니까. ...그래서 좋은 거지만.",
    "...내 답장 기다린 거 아니거든? 우연히 본 거야.",
    "쳇, 그런 거 말 안 해도 알아. 바보냐.",
  ],
  seowoo: [
    "그렇군요. 차분히 들어보니 충분히 이해가 돼요.",
    "당신의 이야기를 듣는 시간이 참 편안하네요.",
    "무리하지 말고 천천히 해도 괜찮아요. 제가 옆에 있을게요.",
    "오늘 하루도 수고 많으셨어요. 스스로를 잘 챙기셨나요?",
    "흥미로운 생각이에요. 조금 더 들려주시겠어요?",
  ],
  hayoon: [
    "ㅋㅋㅋㅋ 대박!! 그거 완전 내 스타일 🤣🔥",
    "야 우리 지금 당장 뭐라도 저질러보자!! 😎",
    "헐 진짜?? 나 방금 소름 돋았잖아 ㅋㅋㅋㅋ",
    "에너지 넘치네 좋아좋아!! 가보자고~ 🎉",
    "심심한데 너랑 얘기하니까 개꿀잼이다 ㅋㅋ 👍",
  ],
}

export function getReply(characterId: string, turn: number): string {
  const pool = replyPools[characterId] ?? ["..."]
  return pool[turn % pool.length]
}

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
