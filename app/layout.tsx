import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '픽앤솔브 | AI 퀴즈 생성',
  description: '내 자료를 업로드하면 AI가 맞춤형 5지선다 문제를 만들어 드립니다.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ background: '#FAFAF8', minHeight: '100vh' }}>
        <header style={{
          background: '#fff',
          borderBottom: '2px solid #1a1a1a',
          padding: '0 24px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <span style={{
                background: '#F25A79',
                color: '#fff',
                fontWeight: 800,
                fontSize: '14px',
                padding: '3px 10px',
                borderRadius: '100px',
                letterSpacing: '-0.3px',
              }}>PICK</span>
              <span style={{
                background: '#6698E6',
                color: '#fff',
                fontWeight: 800,
                fontSize: '14px',
                padding: '3px 10px',
                borderRadius: '100px',
                letterSpacing: '-0.3px',
              }}>SOLVE</span>
            </a>
            <span style={{ color: '#999', fontSize: '13px' }}>AI 퀴즈 생성기</span>
          </div>
        </header>
        <main style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 20px' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
