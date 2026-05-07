import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '픽앤솔브 | AI 퀴즈 생성',
  description: '내 자료를 업로드하면 AI가 맞춤형 5지선다 문제를 만들어 드립니다.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {/* 배경 그라디언트 */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden',
        }}>
          {/* 블롭 1 - 좌상단 퍼플 */}
          <div style={{
            position: 'absolute', top: '-80px', left: '-60px',
            width: '420px', height: '400px',
            background: 'radial-gradient(ellipse at 40% 40%, rgba(167,139,250,0.45) 0%, rgba(139,92,246,0.2) 50%, transparent 70%)',
            borderRadius: '60% 40% 55% 45% / 45% 55% 45% 55%',
            filter: 'blur(2px)',
          }} />
          {/* 블롭 2 - 우하단 블루 */}
          <div style={{
            position: 'absolute', bottom: '-60px', right: '-40px',
            width: '380px', height: '360px',
            background: 'radial-gradient(ellipse at 60% 60%, rgba(96,165,250,0.4) 0%, rgba(59,130,246,0.18) 50%, transparent 70%)',
            borderRadius: '45% 55% 40% 60% / 55% 45% 55% 45%',
            filter: 'blur(2px)',
          }} />
          {/* 블롭 3 - 중앙우 핑크-퍼플 */}
          <div style={{
            position: 'absolute', top: '38%', right: '-30px',
            width: '260px', height: '280px',
            background: 'radial-gradient(ellipse at 50% 50%, rgba(196,148,251,0.3) 0%, rgba(167,139,250,0.12) 55%, transparent 70%)',
            borderRadius: '55% 45% 50% 50% / 50% 60% 40% 50%',
            filter: 'blur(2px)',
          }} />
          {/* 블롭 4 - 좌하단 민트-블루 */}
          <div style={{
            position: 'absolute', bottom: '20%', left: '-20px',
            width: '200px', height: '200px',
            background: 'radial-gradient(ellipse, rgba(56,189,248,0.25) 0%, transparent 65%)',
            borderRadius: '50% 60% 40% 50% / 60% 40% 60% 40%',
            filter: 'blur(1px)',
          }} />
        </div>

        {/* 헤더 */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(230,220,255,0.6)',
          height: '52px', padding: '0 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Pick & Solve
            </span>
            <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 600 }}>AI 퀴즈</span>
          </a>
        </header>

        <main style={{ maxWidth: '520px', margin: '0 auto', padding: '24px 16px', position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  )
}
