'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/store/quizStore'
import { T } from '@/lib/i18n'
import dynamic from 'next/dynamic'

const ConfettiClient = dynamic(() => import('@/components/Confetti'), { ssr: false })

const card: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid rgba(220,62,38,0.08)',
  boxShadow: '0 4px 20px rgba(220,62,38,0.10), 0 1px 4px rgba(0,0,0,0.06)',
  borderRadius: '22px',
  padding: '22px',
}

const SCORE_CONFIG = [
  { min: 90, emoji: '🏆', from: '#EDCD44', mid: '#f5a623', to: '#DC3E26' },
  { min: 70, emoji: '🎉', from: '#DC3E26', mid: '#e8762a', to: '#EDCD44' },
  { min: 50, emoji: '💪', from: '#81CAD6', mid: '#3aa8c1', to: '#0a7fa0' },
  { min: 0,  emoji: '📖', from: '#e11d48', mid: '#f43f5e', to: '#fb7185' },
]

export default function ResultPage() {
  const router = useRouter()
  const { questions, answers, config, reset, uiLang } = useQuizStore()
  const t = T[uiLang] ?? T['KR']

  const [showCelebration, setShowCelebration] = useState(true)

  useEffect(() => {
    if (questions.length === 0) router.replace('/')
  }, [questions.length, router])

  useEffect(() => {
    if (questions.length === 0) return
    const timer = setTimeout(() => setShowCelebration(false), 3000)
    return () => clearTimeout(timer)
  }, [questions.length])

  if (questions.length === 0) return null

  const mainAnswers = answers.filter((a) => a.questionId !== 999)
  const correctCount = mainAnswers.filter((a) => a.isCorrect).length
  const total = questions.length
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0
  const confIdx = SCORE_CONFIG.findIndex((s) => score >= s.min)
  const conf = SCORE_CONFIG[confIdx >= 0 ? confIdx : SCORE_CONFIG.length - 1]
  const confLabel = t.resultTitles[confIdx >= 0 ? confIdx : t.resultTitles.length - 1] ?? t.resultTitles[t.resultTitles.length - 1]
  const difficulty = config?.difficulty ?? 'normal'
  const diffLabel = t.diffLabels[difficulty] ?? difficulty

  return (
    <>
      {/* 폭죽 */}
      {showCelebration && <ConfettiClient />}

      {/* 축하 오버레이 */}
      {showCelebration && (
        <div
          onClick={() => setShowCelebration(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(220,62,38,0.6)',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
            animation: 'fadeIn 0.4s ease',
          }}
        >
          <div style={{ fontSize: '72px', marginBottom: '20px', animation: 'bounce 0.6s ease infinite alternate' }}>
            🎊
          </div>

          {/* 점수 뱃지 */}
          <div style={{
            background: 'rgba(255,255,255,0.25)',
            border: '2px solid rgba(255,255,255,0.5)',
            borderRadius: '100px', padding: '8px 28px',
            marginBottom: '20px',
          }}>
            <span style={{ fontSize: '32px', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>
              {correctCount}
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
              /{total}
            </span>
          </div>

          <p style={{
            fontSize: '26px', fontWeight: 900, color: '#fff',
            textAlign: 'center', lineHeight: 1.6,
            textShadow: '0 2px 20px rgba(0,0,0,0.2)',
            letterSpacing: '-0.3px',
            margin: 0,
          }}>
            {t.celebLine1}<br />
            <span style={{
              background: 'linear-gradient(135deg, #fff, #EDCD44)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {t.celebLine2}
            </span>
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginTop: '28px' }}>
            {t.tapToContinue}
          </p>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes bounce { from { transform: translateY(0) } to { transform: translateY(-14px) } }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* 점수 카드 */}
        <div style={{
          ...card,
          background: `linear-gradient(135deg, ${conf.from} 0%, ${conf.mid} 50%, ${conf.to} 100%)`,
          border: 'none',
          textAlign: 'center',
          padding: '36px 24px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `0 8px 32px ${conf.from}55`,
        }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-20px', width: '130px', height: '130px', background: 'rgba(255,255,255,0.12)', borderRadius: '55% 45% 50% 50% / 45% 60% 40% 55%' }} />
          <div style={{ position: 'absolute', bottom: '-20px', left: '-10px', width: '90px', height: '90px', background: 'rgba(255,255,255,0.08)', borderRadius: '50% 60% 40% 55% / 60% 40% 60% 40%' }} />

          <div style={{ fontSize: '44px', position: 'relative' }}>{conf.emoji}</div>

          {/* X/Y 큰 표시 */}
          <div style={{ position: 'relative', marginTop: '8px', lineHeight: 1 }}>
            <span style={{ fontSize: '72px', fontWeight: 900, color: '#fff', letterSpacing: '-3px', textShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
              {correctCount}
            </span>
            <span style={{ fontSize: '32px', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>
              /{total}
            </span>
          </div>

          <p style={{ fontWeight: 900, fontSize: '17px', color: '#fff', margin: '6px 0 20px', position: 'relative', textShadow: '0 1px 6px rgba(0,0,0,0.1)' }}>
            {confLabel}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', position: 'relative' }}>
            {[
              { label: t.statCorrect, value: correctCount },
              { label: t.statWrong, value: total - correctCount },
              { label: t.statDiff, value: diffLabel },
            ].map((item) => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.22)', borderRadius: '13px', padding: '9px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>{item.value}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 문제별 결과 */}
        <h2 style={{
          margin: '4px 0', fontWeight: 800, fontSize: '14px', textAlign: 'center',
          color: '#DC3E26',
        }}>{t.reviewTitle}</h2>

        {questions.map((q, i) => {
          const answer = mainAnswers.find((a) => a.questionId === q.id)
          const isCorrect = answer?.isCorrect ?? false
          const correctOpt = q.options.find((o) => o.label === q.correctLabel)
          const selectedOpt = q.options.find((o) => o.label === answer?.selectedLabel)

          return (
            <div key={q.id} style={{
              ...card, padding: '16px',
              background: isCorrect ? 'rgba(240,253,244,0.97)' : 'rgba(255,241,242,0.97)',
              border: isCorrect ? '1.5px solid #6ee7b7' : '1.5px solid #fda4af',
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{
                  flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%',
                  background: isCorrect ? '#d1fae5' : '#ffe4e6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                  color: isCorrect ? '#065f46' : '#be123c', fontWeight: 800,
                }}>{isCorrect ? '✓' : '✗'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 7px', fontSize: '13px', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.5 }}>
                    <span style={{ color: '#DC3E26', marginRight: '3px' }}>Q{i + 1}.</span>{q.question}
                  </p>
                  {!isCorrect && (
                    <div style={{ fontSize: '12px', marginBottom: '7px' }}>
                      <p style={{ margin: '0 0 3px', color: '#be123c', fontWeight: 600 }}>{t.myAnswer} {answer?.selectedLabel}. {selectedOpt?.text ?? t.notSelected}</p>
                      <p style={{ margin: 0, color: '#065f46', fontWeight: 600 }}>{t.correctAnswer} {q.correctLabel}. {correctOpt?.text}</p>
                    </div>
                  )}
                  <details style={{ fontSize: '12px' }}>
                    <summary style={{ cursor: 'pointer', color: '#0a7fa0', fontWeight: 600, userSelect: 'none' }}>{t.showExplanation}</summary>
                    <p style={{ margin: '7px 0 0', color: '#333', lineHeight: 1.75, paddingLeft: '10px', borderLeft: '3px solid #b8e0e8' }}>
                      {q.explanation}
                    </p>
                  </details>
                </div>
              </div>
            </div>
          )
        })}

        <button onClick={() => { reset(); router.push('/') }} style={{
          width: '100%', padding: '18px', marginBottom: '32px',
          background: 'linear-gradient(135deg, #DC3E26 0%, #EDCD44 100%)',
          border: 'none',
          borderRadius: '16px', color: '#fff', fontWeight: 900,
          fontSize: '16px', cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(220,62,38,0.4)',
          textShadow: '0 1px 4px rgba(0,0,0,0.1)',
        }}>
          {t.retryBtn}
        </button>
      </div>
    </>
  )
}
