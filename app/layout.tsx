import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '픽앤솔브 | AI 퀴즈 생성',
  description: '내 자료를 업로드하면 AI가 맞춤형 5지선다 문제를 만들어 드립니다.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <a href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700">
              픽앤솔브
            </a>
            <span className="text-slate-400 text-sm ml-1">AI 퀴즈 생성기</span>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
