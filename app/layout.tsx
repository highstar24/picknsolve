import type { Metadata } from 'next'
import './globals.css'
import LangSelector from '@/components/LangSelector'

export const metadata: Metadata = {
  title: '픽앤솔브 | AI 퀴즈 생성',
  description: '내 자료를 업로드하면 AI가 맞춤형 5지선다 문제를 만들어 드립니다.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {/* 배경 블롭 장식 */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {/* 레드 블롭 - 우상단 */}
          <div style={{
            position: 'absolute', top: '-80px', right: '-60px',
            width: '380px', height: '380px',
            background: 'radial-gradient(ellipse, rgba(220,62,38,0.30) 0%, rgba(237,205,68,0.10) 50%, transparent 70%)',
            borderRadius: '60% 40% 55% 45% / 45% 60% 40% 55%',
            filter: 'blur(30px)',
          }} />
          {/* 옐로우 블롭 - 좌중단 */}
          <div style={{
            position: 'absolute', top: '25%', left: '-70px',
            width: '300px', height: '300px',
            background: 'radial-gradient(ellipse, rgba(237,205,68,0.38) 0%, rgba(237,205,68,0.08) 55%, transparent 70%)',
            borderRadius: '45% 55% 40% 60% / 55% 40% 60% 45%',
            filter: 'blur(25px)',
          }} />
          {/* 레드 소블롭 - 우하단 */}
          <div style={{
            position: 'absolute', bottom: '-50px', right: '-30px',
            width: '280px', height: '280px',
            background: 'radial-gradient(ellipse, rgba(220,62,38,0.22) 0%, rgba(237,205,68,0.08) 55%, transparent 70%)',
            borderRadius: '50% 60% 45% 55% / 60% 45% 55% 40%',
            filter: 'blur(20px)',
          }} />
          {/* 옐로우 소블롭 - 좌하단 */}
          <div style={{
            position: 'absolute', bottom: '10%', left: '0%',
            width: '220px', height: '220px',
            background: 'radial-gradient(ellipse, rgba(237,205,68,0.30) 0%, transparent 65%)',
            borderRadius: '55% 45% 50% 50% / 50% 55% 45% 50%',
            filter: 'blur(15px)',
          }} />
        </div>

        {/* 헤더 */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(220,62,38,0.15)',
          height: '52px', padding: '0 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #81CAD6, #EDCD44, #DC3E26)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Pick & Solve
            </span>
          </a>
          <LangSelector />
        </header>

        <main style={{ maxWidth: '520px', margin: '0 auto', padding: '20px 14px', position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  )
}
