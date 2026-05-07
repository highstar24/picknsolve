'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/store/quizStore'

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.45)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1.5px solid rgba(255,255,255,0.7)',
  boxShadow: '0 8px 32px rgba(150,100,200,0.12)',
  borderRadius: '24px',
  padding: '24px',
}

const SCORE_CONFIG = [
  { min: 90, emoji: '🏆', label: '완벽 마스터!', bg: 'linear-gradient(135deg,rgba(200,240,200,0.6),rgba(150,220,150,0.5))' },
  { min: 70, emoji: '🎉', label: '잘했어요!',   bg: 'linear-gradient(135deg,rgba(255,240,150,0.5),rgba(255,210,80,0.4))' },
  { min: 50, emoji: '💪', label: '절반 성공!',  bg: 'linear-gradient(135deg,rgba(255,210,150,0.5),rgba(255,180,80,0.4))' },
  { min: 0,  emoji: '📖', label: '더 공부해요', bg: 'linear-gradient(135deg,rgba(246,188,186,0.5),rgba(240,140,140,0.4))' },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* 점수 카드 */}
      <div style={{ ...glassCard, background: conf.bg, textAlign: 'center', padding: '36px 24px' }}>
        <div style={{ fontSize: '52px' }}>{conf.emoji}</div>
        <div style={{ fontSize: '64px', fontWeight: 900, color: '#2d1b4e', letterSpacing: '-2px', lineHeight: 1, marginTop: '8px' }}>
          {score}<span style={{ fontSize: '24px', fontWeight: 700, color: '#7a6090' }}>점</span>
        </div>
        <p style={{ fontWeight: 800, fontSize: '18px', color: '#2d1b4e', margin: '8px 0 20px' }}>{conf.label}</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          {[
            { label: '정답', value: correctCount },
            { label: '오답', value: questions.length - correctCount },
            { label: '난이도', value: DIFFICULTY_LABEL[config.difficulty] },
          ].map((item) => (
            <div key={item.label} style={{
              background: 'rgba(255,255,255,0.55)', borderRadius: '14px',
              padding: '10px 16px', textAlign: 'center',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#2d1b4e' }}>{item.value}</div>
              <div style={{ fontSize: '11px', color: '#9b8ab0', marginTop: '2px' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 문제별 결과 */}
      <h2 style={{ margin: '4px 0', fontWeight: 800, fontSize: '16px', color: '#2d1b4e', textAlign: 'center' }}>문제별 결과</h2>

      {questions.map((q, i) => {
        const answer = mainAnswers.find((a) => a.questionId === q.id)
        const isCorrect = answer?.isCorrect ?? false
        const correctOpt = q.options.find((o) => o.label === q.correctLabel)
        const selectedOpt = q.options.find((o) => o.label === answer?.selectedLabel)

        return (
          <div key={q.id} style={{
            ...glassCard, padding: '18px',
            background: isCorrect ? 'rgba(200,240,200,0.35)' : 'rgba(246,188,186,0.3)',
            border: isCorrect ? '1.5px solid rgba(150,220,150,0.5)' : '1.5px solid rgba(246,188,186,0.6)',
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{
                flexShrink: 0, width: '26px', height: '26px', borderRadius: '50%',
                background: isCorrect ? 'rgba(100,200,100,0.4)' : 'rgba(220,100,100,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px',
              }}>{isCorrect ? '✓' : '✗'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600, color: '#2d1b4e', lineHeight: 1.5 }}>
                  <span style={{ color: '#b0a0c0', marginRight: '4px' }}>Q{i + 1}.</span>{q.question}
                </p>
                {!isCorrect && (
                  <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                    <p style={{ margin: '0 0 3px', color: '#c05050', fontWeight: 600 }}>내 답: {answer?.selectedLabel}. {selectedOpt?.text ?? '미선택'}</p>
                    <p style={{ margin: 0, color: '#3a8a00', fontWeight: 600 }}>정답: {q.correctLabel}. {correctOpt?.text}</p>
                  </div>
                )}
                <details style={{ fontSize: '13px' }}>
                  <summary style={{ cursor: 'pointer', color: '#9b8ab0', fontWeight: 600, userSelect: 'none' }}>해설 보기</summary>
                  <p style={{ margin: '8px 0 0', color: '#4a3060', lineHeight: 1.7, paddingLeft: '10px', borderLeft: '3px solid rgba(200,168,233,0.5)' }}>
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
        background: 'linear-gradient(135deg, #C8A8E9, #C3C7F4)',
        border: '1.5px solid rgba(255,255,255,0.7)',
        borderRadius: '18px', color: '#fff', fontWeight: 800,
        fontSize: '16px', cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(200,168,233,0.4)',
      }}>
        🔁 새 퀴즈 만들기
      </button>
    </div>
  )
}
