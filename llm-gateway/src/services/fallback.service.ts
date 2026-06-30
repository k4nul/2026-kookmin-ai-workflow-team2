const girlfriendFallbacks: Record<string, string> = {
  gf_minseo: "지금 뭐라고 해야 할지 모르겠어.",
  gf_jiyoon: "잠깐 생각 좀 할게.",
  gf_seoa: "지금은 말이 잘 안 나와.",
  gf_harin: "얘기하기엔 조금 힘들다. 다시 얘기하자."
};

const defaultGirlfriendFallback = "잠깐만, 지금은 바로 답하기 어렵겠어.";

const dailyFeedbackFallback =
  "오늘의 피드백: 상대의 감정 상태와 답장 타이밍이 중요했습니다. 다음에는 힘든 이야기를 꺼냈을 때 먼저 공감하고, 필요한 경우 짧게라도 빠르게 반응하는 편이 좋습니다.";

export function getGirlfriendFallbackReply(girlfriendId?: string): string {
  if (!girlfriendId) {
    return defaultGirlfriendFallback;
  }

  return girlfriendFallbacks[girlfriendId] ?? defaultGirlfriendFallback;
}

export function getDailyFeedbackFallback(): string {
  return dailyFeedbackFallback;
}

export function getIntentFallback(): {
  intent: "UNKNOWN";
  confidence: 0;
  reason: string;
} {
  return {
    intent: "UNKNOWN",
    confidence: 0,
    reason: "분류에 실패했습니다."
  };
}
