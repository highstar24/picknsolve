'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/store/quizStore'
import { T } from '@/lib/i18n'
import dynamic from 'next/dynamic'

const ConfettiClient = dynamic(() => import('@/components/Confetti'), { ssr: false })

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(255,255,255,0.7)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
  borderRadius: '22px',
  padding: '22px',
}

const SCORE_CONFIG = [
  { min: 90, emoji: '🏆', from: '#FFAF24', mid: '#FF7F42', to: '#FFE2B8' },
  { min: 70, emoji: '🎉', from: '#FF7F42', mid: '#FFAF24', to: '#f97316' },
  { min: 50, emoji: '💪', from: '#AC87CD', mid: '#724784', to: '#9333ea' },
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

  // 축하 오버레이 2.5초 후 자동 닫힘
  useEffect(() => {
    if (questions.length === 0) return
    const timer = setTimeout(() => setShowCelebration(false), 2500)
    return () => clearTimeout(timer)
  }, [questions.length])

  if (questions.length === 0) return null

  const mainAnswers = answers.filter((a) => a.questionId !== 999)
  const correctCount = mainAnswers.filter((a) => a.isCorrect).length
  const score = Math.round((correctCount / questions.length) * 100)
  const confIdx = SCORE_CONFIG.findIndex((s) => score >= s.min)
  const conf = confIdx >= 0 ? SCORE_CONFIG[confIdx] : SCORE_CONFIG[SCORE_CONFIG.length - 1]
  const confLabel = confIdx >= 0
    ? (t.resultTitles[confIdx] ?? t.resultTitles[t.resultTitles.length - 1])
    : t.resultTitles[t.resultTitles.length - 1]
  const diffLabel = t.diffLabels[config.difficulty] ?? config.difficulty

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
            background: 'rgba(80,0,140,0.55)',
            backdropFilter: 'blur(6px)',
            cursor: 'pointer',
            animation: 'fadeIn 0.4s ease',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px', animation: 'bounce 0.6s ease infinite alternate' }}>
            🎊
          </div>
          <p style={{
            fontSize: '28px', fontWeight: 900, color: '#fff',
            textAlign: 'center', lineHeight: 1.5,
            textShadow: '0 2px 20px rgba(0,0,0,0.3)',
            letterSpacing: '-0.5px',
          }}>
            오늘도 한걸음<br />
            <span style={{
              background: 'linear-gradient(135deg, #FF7F42, #FFAF24, #FFE2B8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              성장하셨습니다
            </span>
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '24px' }}>
            탭하면 결과 보기
          </p>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes bounce { from { transform: translateY(0) } to { transform: translateY(-12px) } }
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
          <div style={{
            position: 'absolute', top: '-30px', right: '-20px', width: '130px', height: '130px',
            background: 'rgba(255,255,255,0.12)',
            borderRadius: '55% 45% 50% 50% / 45% 60% 40% 55%',
          }} />
          <div style={{
            position: 'absolute', bottom: '-20px', left: '-10px', width: '90px', height: '90px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '50% 60% 40% 55% / 60% 40% 60% 40%',
          }} />

          <div style={{ fontSize: '46px', position: 'relative' }}>{conf.emoji}</div>
          <div style={{
            fontSize: '68px', fontWeight: 900, color: '#fff',
            letterSpacing: '-3px', lineHeight: 1, marginTop: '6px', position: 'relative',
            textShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}>
            {score}<span style={{ fontSize: '22px', fontWeight: 700, opacity: 0.85 }}>{t.scoreUnit}</span>
          </div>
          <p style={{ fontWeight: 900, fontSize: '18px', color: '#fff', margin: '6px 0 20px', position: 'relative', textShadow: '0 1px 6px rgba(0,0,0,0.1)' }}>
            {confLabel}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', position: 'relative' }}>
            {[
              { label: t.statCorrect, value: correctCount },
              { label: t.statWrong, value: questions.length - correctCount },
              { label: t.statDiff, value: diffLabel },
            ].map((item) => (
              <div key={item.label} style={{
                background: 'rgba(255,255,255,0.22)',
                borderRadius: '13px', padding: '9px 14px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>{item.value}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 문제별 결과 */}
        <h2 style={{
          margin: '4px 0', fontWeight: 800, fontSize: '14px', textAlign: 'center',
          color: 'rgba(255,255,255,0.85)',
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
                  <p style={{ margin: '0 0 7px', fontSize: '13px', fontWeight: 600, color: '#2d0a4e', lineHeight: 1.5 }}>
                    <span style={{ color: '#c084fc', marginRight: '3px' }}>Q{i + 1}.</span>{q.question}
                  </p>
                  {!isCorrect && (
                    <div style={{ fontSize: '12px', marginBottom: '7px' }}>
                      <p style={{ margin: '0 0 3px', color: '#be123c', fontWeight: 600 }}>{t.myAnswer} {answer?.selectedLabel}. {selectedOpt?.text ?? t.notSelected}</p>
                      <p style={{ margin: 0, color: '#065f46', fontWeight: 600 }}>{t.correctAnswer} {q.correctLabel}. {correctOpt?.text}</p>
                    </div>
                  )}
                  <details style={{ fontSize: '12px' }}>
                    <summary style={{ cursor: 'pointer', color: '#a855f7', fontWeight: 600, userSelect: 'none' }}>{t.showExplanation}</summary>
                    <p style={{ margin: '7px 0 0', color: '#4a1080', lineHeight: 1.75, paddingLeft: '10px', borderLeft: '3px solid #e9d5ff' }}>
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
          background: 'linear-gradient(135deg, #FF7F42 0%, #FFAF24 100%)',
          border: 'none',
          borderRadius: '16px', color: '#fff', fontWeight: 900,
          fontSize: '16px', cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(255,127,66,0.45)',
          textShadow: '0 1px 4px rgba(0,0,0,0.1)',
        }}>
          {t.retryBtn}
        </button>
      </div>
    </>
  )
}
