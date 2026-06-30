/** Format a Date into a KakaoTalk-style Korean time label, e.g. "오후 2:30" */
export function formatKoreanTime(date: Date): string {
  let hours = date.getHours()
  const minutes = date.getMinutes()
  const period = hours < 12 ? "오전" : "오후"
  hours = hours % 12
  if (hours === 0) hours = 12
  const mm = minutes.toString().padStart(2, "0")
  return `${period} ${hours}:${mm}`
}

/** Format a Date into a header label, e.g. "3월 14일 오후 2:30" */
export function formatVirtualDateTime(date: Date): string {
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}월 ${day}일 · ${formatKoreanTime(date)}`
}

/** Random demo-mode jump: 20-30 minutes forward */
export function demoJumpMinutes(): number {
  return 20 + Math.floor(Math.random() * 11)
}
