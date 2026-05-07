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
        {/* 배경 장식 */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', top: '-100px', left: '-80px',
            width: '400px', height: '400px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,168,233,0.4) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-80px', right: '-60px',
            width: '350px', height: '350px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(195,199,244,0.5) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', top: '40%', right: '10%',
            width: '200px', height: '200px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(246,188,186,0.3) 0%, transparent 70%)',
          }} />
        </div>

        {/* 헤더 */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(255,255,255,0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.5)',
          padding: '0 24px', height: '56px',
          display: 'flex', alignItems: 'center',
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <span style={{
                background: 'linear-gradient(135deg, #E3AADD, #C8A8E9)',
                color: '#fff', fontWeight: 800, fontSize: '15px',
                padding: '4px 14px', borderRadius: '100px',
                letterSpacing: '0.5px',
                boxShadow: '0 2px 12px rgba(200,168,233,0.4)',
              }}>PICK & SOLVE</span>
            </a>
            <span style={{ color: 'rgba(45,27,78,0.5)', fontSize: '12px' }}>AI 퀴즈 생성기</span>
          </div>
        </header>

        <main style={{ maxWidth: '600px', margin: '0 auto', padding: '28px 20px', position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  )
}
