import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '픽앤솔브 | AI 퀴즈 생성',
  description: '내 자료를 업로드하면 AI가 맞춤형 5지선다 문제를 만들어 드립니다.',
}

const G = {
  card: {
    background: 'rgba(255,255,255,0.55)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.8)',
    boxShadow: '0 4px 24px rgba(160,120,220,0.08)',
  } as React.CSSProperties,
}

export { G }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {/* 배경 블러 오브 */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-120px', left: '-80px', width: '480px', height: '480px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(197,168,242,0.35) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', bottom: '-100px', right: '-60px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,195,242,0.3) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', top: '45%', right: '5%', width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(242,168,210,0.2) 0%, transparent 65%)' }} />
        </div>

        <header style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(255,255,255,0.35)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.6)',
          height: '52px', padding: '0 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #b06bff, #7b9eff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Pick & Solve
            </span>
            <span style={{ fontSize: '11px', color: '#b0a0c8', fontWeight: 500 }}>AI 퀴즈</span>
          </a>
        </header>

        <main style={{ maxWidth: '520px', margin: '0 auto', padding: '24px 16px', position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  )
}
