'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/store/quizStore'
import type { QuizQuestion } from '@/types'

export default function QuizPage() {
  const router = useRouter()
  const {
    questions, currentIndex, answers, showFeedback,
    similarQuestion, isSimilarMode, config, sourceText,
    fileBase64, fileType, submitAnswer, nextQuestion,
    setSimilarQuestion, enterSimilarMode, exitSimilarMode,
  } = useQuizStore()

  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)

  const isFinished = currentIndex >= questions.length && !isSimilarMode

  useEffect(() => { if (questions.length === 0) router.replace('/') }, [questions.length, router])
  useEffect(() => { setSelectedLabel(null) }, [currentIndex, isSimilarMode])
  useEffect(() => { if (isFinished) router.push('/result') }, [isFinished, router])

  if (questions.length === 0) return null

  const currentQuestion: QuizQuestion = isSimilarMode && similarQuestion ? similarQuestion : questions[currentIndex]
  const lastAnswer = answers[answers.length - 1]
  const totalCount = questions.length
  const progress = Math.round((currentIndex / totalCount) * 100)

  function handleSelect(label: string) {
    if (showFeedback) return
    setSelectedLabel(label)
    submitAnswer(label)
  }

  async function handleSimilar() {
    setLoadingSimilar(true)
    try {
      const body: Record<string, unknown> = {
        originalQuestion: currentQuestion.question,
        difficulty: config.difficulty,
        sourceText: sourceText || '',
      }
      if (fileBase64) { body.fileBase64 = fileBase64; body.fileType = fileType }
      const res = await fetch('/api/similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSimilarQuestion(data.question)
      enterSimilarMode()
    } catch {
      alert('유사 문제 생성에 실패했습니다.')
    } finally {
      setLoadingSimilar(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* 진행 바 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: '13px', fontWeight: 700,
            color: isSimilarMode ? '#FFAB39' : '#6698E6',
            background: isSimilarMode ? '#fff5e6' : '#eef2ff',
            padding: '3px 10px', borderRadius: '100px',
          }}>
            {isSimilarMode ? '🔄 유사 문제' : `${currentIndex + 1} / ${totalCount}`}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>{progress}%</span>
        </div>
        <div style={{ height: '6px', background: '#eee', borderRadius: '100px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '100px',
            background: 'linear-gradient(90deg, #92D0D8, #6698E6)',
            width: `${progress}%`, transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* 문제 카드 */}
      <div style={{
        background: '#fff', border: '2px solid #1a1a1a',
        borderRadius: '20px', padding: '24px',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        <p style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.6, margin: 0, color: '#1a1a1a' }}>
          {currentQuestion.question}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {currentQuestion.options.map((opt) => {
            const isSelected = selectedLabel === opt.label
            const isCorrect = opt.label === currentQuestion.correctLabel

            let bg = '#f8f8f8'
            let border = '1.5px solid #e8e8e8'
            let color = '#333'

            if (showFeedback) {
              if (isCorrect) { bg = '#A6E553'; border = '2px solid #1a1a1a'; color = '#1a1a1a' }
              else if (isSelected && !isCorrect) { bg = '#F25A79'; border = '2px solid #1a1a1a'; color = '#fff' }
              else { bg = '#f3f3f3'; border = '1.5px solid #e8e8e8'; color = '#bbb' }
            } else if (isSelected) {
              bg = '#FFFD87'; border = '2px solid #1a1a1a'; color = '#1a1a1a'
            }

            return (
              <button
                key={opt.label}
                onClick={() => handleSelect(opt.label)}
                disabled={showFeedback}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '13px 16px', borderRadius: '12px',
                  border, background: bg, color,
                  cursor: showFeedback ? 'default' : 'pointer',
                  textAlign: 'left', fontSize: '14px', fontWeight: 500,
                  transition: 'all 0.12s', width: '100%',
                }}
                onMouseEnter={e => { if (!showFeedback) e.currentTarget.style.borderColor = '#6698E6' }}
                onMouseLeave={e => { if (!showFeedback && !isSelected) e.currentTarget.style.borderColor = '#e8e8e8' }}
              >
                <span style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  border: `1.5px solid ${color}`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '12px', flexShrink: 0,
                }}>
                  {opt.label}
                </span>
                <span style={{ flex: 1 }}>{opt.text}</span>
                {showFeedback && isCorrect && <span>✅</span>}
                {showFeedback && isSelected && !isCorrect && <span>❌</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* 피드백 */}
      {showFeedback && lastAnswer && (
        <div style={{
          background: lastAnswer.isCorrect ? '#A6E553' : '#fff0f3',
          border: '2px solid #1a1a1a', borderRadius: '20px', padding: '20px',
          display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>{lastAnswer.isCorrect ? '🎉' : '😅'}</span>
            <span style={{ fontWeight: 800, fontSize: '18px', color: '#1a1a1a' }}>
              {lastAnswer.isCorrect ? '정답!' : '오답'}
            </span>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '14px',
            fontSize: '13px', color: '#333', lineHeight: 1.7,
          }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: 700, fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>해설</p>
            {currentQuestion.explanation}
          </div>

          {!lastAnswer.isCorrect && !isSimilarMode && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSimilar}
                disabled={loadingSimilar}
                style={{
                  flex: 1, padding: '13px', borderRadius: '12px',
                  border: '2px solid #1a1a1a',
                  background: loadingSimilar ? '#eee' : '#FFAB39',
                  color: '#1a1a1a', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                }}
              >
                {loadingSimilar ? '생성 중...' : '🔄 유사 문제 풀기'}
              </button>
              <button
                onClick={() => exitSimilarMode()}
                style={{
                  flex: 1, padding: '13px', borderRadius: '12px',
                  border: '2px solid #1a1a1a',
                  background: '#fff', color: '#555',
                  fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                }}
              >
                ⏭ 패스
              </button>
            </div>
          )}

          {(lastAnswer.isCorrect || isSimilarMode) && (
            <button
              onClick={nextQuestion}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                border: '2px solid #1a1a1a',
                background: '#1a1a1a', color: '#FFFD87',
                fontWeight: 800, fontSize: '15px', cursor: 'pointer',
              }}
            >
              {currentIndex + 1 >= totalCount && !isSimilarMode ? '결과 보기 →' : '다음 문제 →'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
