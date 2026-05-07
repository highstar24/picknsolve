'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/store/quizStore'

const SCORE_CONFIG = [
  { min: 90, emoji: '🏆', label: '완벽 마스터!', color: '#A6E553', text: '#1a1a1a' },
  { min: 70, emoji: '🎉', label: '잘했어요!', color: '#FFFD87', text: '#1a1a1a' },
  { min: 50, emoji: '💪', label: '절반 성공!', color: '#FFAB39', text: '#1a1a1a' },
  { min: 0,  emoji: '📖', label: '더 공부해요', color: '#F25A79', text: '#fff' },
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
  const scoreConf = SCORE_CONFIG.find((s) => score >= s.min) ?? SCORE_CONFIG[SCORE_CONFIG.length - 1]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* 점수 카드 */}
      <div style={{
        background: scoreConf.color, border: '2px solid #1a1a1a',
        borderRadius: '20px', padding: '32px 24px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-30px', right: '-30px',
          width: '120px', height: '120px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
        }} />
        <div style={{ fontSize: '48px' }}>{scoreConf.emoji}</div>
        <div style={{ fontSize: '64px', fontWeight: 900, color: scoreConf.text, letterSpacing: '-2px', lineHeight: 1 }}>
          {score}
          <span style={{ fontSize: '24px', fontWeight: 700 }}>점</span>
        </div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: scoreConf.text, marginTop: '6px' }}>
          {scoreConf.label}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
          {[
            { label: '정답', value: correctCount, color: '#1a1a1a' },
            { label: '오답', value: questions.length - correctCount, color: '#1a1a1a' },
            { label: '난이도', value: DIFFICULTY_LABEL[config.difficulty], color: '#1a1a1a' },
          ].map((item) => (
            <div key={item.label} style={{
              background: 'rgba(255,255,255,0.6)', borderRadius: '12px',
              padding: '8px 14px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 문제별 결과 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={{ margin: 0, fontWeight: 800, fontSize: '16px' }}>문제별 결과</h2>
        {questions.map((q, i) => {
          const answer = mainAnswers.find((a) => a.questionId === q.id)
          const isCorrect = answer?.isCorrect ?? false
          const selectedLabel = answer?.selectedLabel
          const correctOpt = q.options.find((o) => o.label === q.correctLabel)
          const selectedOpt = q.options.find((o) => o.label === selectedLabel)

          return (
            <div key={q.id} style={{
              background: '#fff',
              border: `2px solid ${isCorrect ? '#A6E553' : '#F25A79'}`,
              borderRadius: '16px', padding: '16px',
            }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{
                  flexShrink: 0,
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: isCorrect ? '#A6E553' : '#F25A79',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', border: '1.5px solid #1a1a1a',
                }}>
                  {isCorrect ? '✓' : '✗'}
                </span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.5 }}>
                    <span style={{ color: '#aaa', marginRight: '4px' }}>Q{i + 1}.</span>
                    {q.question}
                  </p>

                  {!isCorrect && (
                    <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <p style={{ margin: 0, color: '#F25A79', fontWeight: 600 }}>
                        내 답: {selectedLabel}. {selectedOpt?.text ?? '미선택'}
                      </p>
                      <p style={{ margin: 0, color: '#3a8a00', fontWeight: 600 }}>
                        정답: {q.correctLabel}. {correctOpt?.text}
                      </p>
                    </div>
                  )}

                  <details style={{ fontSize: '13px' }}>
                    <summary style={{ cursor: 'pointer', color: '#888', userSelect: 'none', fontWeight: 600 }}>
                      해설 보기
                    </summary>
                    <p style={{ margin: '8px 0 0 0', color: '#555', lineHeight: 1.7, paddingLeft: '12px', borderLeft: '3px solid #e0e0e0' }}>
                      {q.explanation}
                    </p>
                  </details>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 새 퀴즈 버튼 */}
      <button
        onClick={() => { reset(); router.push('/') }}
        style={{
          width: '100%', padding: '18px', marginBottom: '32px',
          background: '#1a1a1a', color: '#FFFD87',
          border: 'none', borderRadius: '16px',
          fontWeight: 800, fontSize: '16px', cursor: 'pointer',
          letterSpacing: '-0.3px',
        }}
      >
        🔁 새 퀴즈 만들기
      </button>
    </div>
  )
}
