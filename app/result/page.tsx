'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/store/quizStore'

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.5)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1.5px solid rgba(255,255,255,0.75)',
  boxShadow: '0 4px 24px rgba(160,120,220,0.08)',
  borderRadius: '22px',
  padding: '22px',
}

const SCORE_CONFIG = [
  { min: 90, emoji: '🏆', label: '완벽 마스터!', bg: 'linear-gradient(135deg,rgba(180,240,180,0.5),rgba(130,220,130,0.4))' },
  { min: 70, emoji: '🎉', label: '잘했어요!',   bg: 'linear-gradient(135deg,rgba(255,240,150,0.45),rgba(255,210,80,0.35))' },
  { min: 50, emoji: '💪', label: '절반 성공!',  bg: 'linear-gradient(135deg,rgba(255,215,160,0.45),rgba(255,180,80,0.35))' },
  { min: 0,  emoji: '📖', label: '더 공부해요', bg: 'linear-gradient(135deg,rgba(246,188,186,0.45),rgba(240,140,140,0.35))' },
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
      <div style={{ ...card, background: conf.bg, textAlign: 'center', padding: '34px 24px' }}>
        <div style={{ fontSize: '48px' }}>{conf.emoji}</div>
        <div style={{ fontSize: '60px', fontWeight: 900, color: '#4a3570', letterSpacing: '-2px', lineHeight: 1, marginTop: '6px' }}>
          {score}<span style={{ fontSize: '22px', fontWeight: 700, color: '#9080b0' }}>점</span>
        </div>
        <p style={{ fontWeight: 800, fontSize: '17px', color: '#5b3f8a', margin: '6px 0 18px' }}>{conf.label}</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {[
            { label: '정답', value: correctCount },
            { label: '오답', value: questions.length - correctCount },
            { label: '난이도', value: DIFFICULTY_LABEL[config.difficulty] },
          ].map((item) => (
            <div key={item.label} style={{
              background: 'rgba(255,255,255,0.5)', borderRadius: '13px',
              padding: '9px 14px', textAlign: 'center',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#5b3f8a' }}>{item.value}</div>
              <div style={{ fontSize: '10px', color: '#b0a0c8', marginTop: '2px' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 문제별 결과 */}
      <h2 style={{ margin: '4px 0', fontWeight: 800, fontSize: '15px', color: '#8b6ab0', textAlign: 'center' }}>문제별 결과</h2>

      {questions.map((q, i) => {
        const answer = mainAnswers.find((a) => a.questionId === q.id)
        const isCorrect = answer?.isCorrect ?? false
        const correctOpt = q.options.find((o) => o.label === q.correctLabel)
        const selectedOpt = q.options.find((o) => o.label === answer?.selectedLabel)

        return (
          <div key={q.id} style={{
            ...card, padding: '16px',
            background: isCorrect ? 'rgba(190,238,190,0.3)' : 'rgba(246,188,186,0.28)',
            border: isCorrect ? '1.5px solid rgba(150,220,150,0.45)' : '1.5px solid rgba(246,188,186,0.55)',
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{
                flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%',
                background: isCorrect ? 'rgba(100,200,100,0.3)' : 'rgba(220,100,100,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                color: isCorrect ? '#2d6e2d' : '#a03030',
              }}>{isCorrect ? '✓' : '✗'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 7px', fontSize: '13px', fontWeight: 600, color: '#5b3f8a', lineHeight: 1.5 }}>
                  <span style={{ color: '#c0b0d8', marginRight: '3px' }}>Q{i + 1}.</span>{q.question}
                </p>
                {!isCorrect && (
                  <div style={{ fontSize: '12px', marginBottom: '7px' }}>
                    <p style={{ margin: '0 0 3px', color: '#c05050', fontWeight: 600 }}>내 답: {answer?.selectedLabel}. {selectedOpt?.text ?? '미선택'}</p>
                    <p style={{ margin: 0, color: '#2d6e2d', fontWeight: 600 }}>정답: {q.correctLabel}. {correctOpt?.text}</p>
                  </div>
                )}
                <details style={{ fontSize: '12px' }}>
                  <summary style={{ cursor: 'pointer', color: '#b0a0c8', fontWeight: 600, userSelect: 'none' }}>해설 보기</summary>
                  <p style={{ margin: '7px 0 0', color: '#6b4fa0', lineHeight: 1.75, paddingLeft: '10px', borderLeft: '3px solid rgba(200,168,233,0.45)' }}>
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
        background: 'linear-gradient(135deg, #c8a8e9, #b8b4f0)',
        border: '1.5px solid rgba(255,255,255,0.7)',
        borderRadius: '16px', color: '#fff', fontWeight: 800,
        fontSize: '15px', cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(200,168,233,0.38)',
      }}>
        🔁 새 퀴즈 만들기
      </button>
    </div>
  )
}
