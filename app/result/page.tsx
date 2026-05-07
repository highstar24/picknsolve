'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/store/quizStore'

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid rgba(220,215,255,0.6)',
  boxShadow: '0 2px 16px rgba(120,80,220,0.07)',
  borderRadius: '20px',
  padding: '22px',
}

const SCORE_CONFIG = [
  { min: 90, emoji: '🏆', label: '완벽 마스터!', from: '#7c3aed', to: '#4f46e5' },
  { min: 70, emoji: '🎉', label: '잘했어요!',   from: '#f59e0b', to: '#d97706' },
  { min: 50, emoji: '💪', label: '절반 성공!',  from: '#f97316', to: '#ea580c' },
  { min: 0,  emoji: '📖', label: '더 공부해요', from: '#ef4444', to: '#dc2626' },
]

const DIFFICULTY_LABEL: Record<string, string> = { easy: '쉬움', normal: '보통', hard: '어려움' }

export default function ResultPage() {
  const router = useRouter()
  const { questions, answers, config, reset } = useQuizStore()

  useEffect(() => { if (questions.length === 0) router.replace('/') }, [questions.length, router])
  if (questions.length === 0) return null

  const mainAnswers = answers.filter((a) => a.questionId !== 999)
  const correctCount = mainAnswers.filter((a) => a.isCorrect).length
  const score = Math.round((correctCount / questions.length) * 100)
  const conf = SCORE_CONFIG.find((s) => score >= s.min) ?? SCORE_CONFIG[SCORE_CONFIG.length - 1]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* 점수 카드 */}
      <div style={{
        ...card,
        background: `linear-gradient(135deg, ${conf.from}, ${conf.to})`,
        border: 'none',
        textAlign: 'center',
        padding: '36px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '55% 45% 50% 50% / 45% 55% 45% 55%',
        }} />
        <div style={{ fontSize: '44px', position: 'relative' }}>{conf.emoji}</div>
        <div style={{ fontSize: '64px', fontWeight: 900, color: '#fff', letterSpacing: '-3px', lineHeight: 1, marginTop: '6px', position: 'relative' }}>
          {score}<span style={{ fontSize: '22px', fontWeight: 700, opacity: 0.8 }}>점</span>
        </div>
        <p style={{ fontWeight: 800, fontSize: '17px', color: 'rgba(255,255,255,0.9)', margin: '6px 0 20px', position: 'relative' }}>{conf.label}</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', position: 'relative' }}>
          {[
            { label: '정답', value: correctCount },
            { label: '오답', value: questions.length - correctCount },
            { label: '난이도', value: DIFFICULTY_LABEL[config.difficulty] },
          ].map((item) => (
            <div key={item.label} style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '12px', padding: '9px 14px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>{item.value}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 문제별 결과 */}
      <h2 style={{ margin: '4px 0', fontWeight: 800, fontSize: '14px', color: '#6d28d9', textAlign: 'center' }}>문제별 결과</h2>

      {questions.map((q, i) => {
        const answer = mainAnswers.find((a) => a.questionId === q.id)
        const isCorrect = answer?.isCorrect ?? false
        const correctOpt = q.options.find((o) => o.label === q.correctLabel)
        const selectedOpt = q.options.find((o) => o.label === answer?.selectedLabel)

        return (
          <div key={q.id} style={{
            ...card, padding: '16px',
            background: isCorrect ? '#f0fdf4' : '#fef2f2',
            border: isCorrect ? '1.5px solid #6ee7b7' : '1.5px solid #fca5a5',
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{
                flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%',
                background: isCorrect ? '#d1fae5' : '#fee2e2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                color: isCorrect ? '#065f46' : '#b91c1c', fontWeight: 800,
              }}>{isCorrect ? '✓' : '✗'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 7px', fontSize: '13px', fontWeight: 600, color: '#3b2d6e', lineHeight: 1.5 }}>
                  <span style={{ color: '#c4b5fd', marginRight: '3px' }}>Q{i + 1}.</span>{q.question}
                </p>
                {!isCorrect && (
                  <div style={{ fontSize: '12px', marginBottom: '7px' }}>
                    <p style={{ margin: '0 0 3px', color: '#b91c1c', fontWeight: 600 }}>내 답: {answer?.selectedLabel}. {selectedOpt?.text ?? '미선택'}</p>
                    <p style={{ margin: 0, color: '#065f46', fontWeight: 600 }}>정답: {q.correctLabel}. {correctOpt?.text}</p>
                  </div>
                )}
                <details style={{ fontSize: '12px' }}>
                  <summary style={{ cursor: 'pointer', color: '#a78bfa', fontWeight: 600, userSelect: 'none' }}>해설 보기</summary>
                  <p style={{ margin: '7px 0 0', color: '#4c3a8a', lineHeight: 1.75, paddingLeft: '10px', borderLeft: '3px solid #e0d7ff' }}>
                    {q.explanation}
                  </p>
                </details>
              </div>
            </div>
          </div>
        )
      })}

      <button onClick={() => { reset(); router.push('/') }} style={{
        width: '100%', padding: '17px', marginBottom: '32px',
        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
        border: 'none',
        borderRadius: '14px', color: '#fff', fontWeight: 800,
        fontSize: '15px', cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(124,58,237,0.35)',
      }}>
        🔁 새 퀴즈 만들기
      </button>
    </div>
  )
}
