import { NextRequest, NextResponse } from 'next/server'

/** IP별 요청 추적 (엣지 함수 인스턴스 내 메모리) */
const ipMap = new Map<string, { count: number; resetAt: number }>()

/** 분당 최대 요청 수 (IP 기준) */
const MAX_PER_MINUTE = 10
const WINDOW_MS = 60 * 1000

export function middleware(request: NextRequest) {
  // API 경로만 적용
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const now = Date.now()
  const entry = ipMap.get(ip)

  if (!entry || now > entry.resetAt) {
    // 새 윈도우 시작
    ipMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return NextResponse.next()
  }

  if (entry.count >= MAX_PER_MINUTE) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 1분 후 다시 시도해 주세요.' },
      { status: 429 }
    )
  }

  entry.count++
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
