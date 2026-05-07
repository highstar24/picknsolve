// 일일 생성 횟수 제한 (localStorage 기반 — MVP 버전)
const DAILY_LIMIT = 5
const STORAGE_KEY = 'picknsolve_daily'

interface DailyRecord {
  date: string  // YYYY-MM-DD
  count: number
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

export function getRemainingCount(): number {
  if (typeof window === 'undefined') return DAILY_LIMIT

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return DAILY_LIMIT

  const record: DailyRecord = JSON.parse(raw)
  if (record.date !== getToday()) return DAILY_LIMIT

  return Math.max(0, DAILY_LIMIT - record.count)
}

export function incrementCount(): void {
  if (typeof window === 'undefined') return

  const today = getToday()
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 1 }))
    return
  }

  const record: DailyRecord = JSON.parse(raw)
  if (record.date !== today) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 1 }))
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: record.count + 1 }))
  }
}

export function hasRemaining(): boolean {
  return getRemainingCount() > 0
}

export const LIMIT = DAILY_LIMIT
