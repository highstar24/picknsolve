'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/store/quizStore'
import type { QuizQuestion } from '@/types'

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid rgba(220,215,255,0.6)',
  boxShadow: '0 2px 16px rgba(120,80,220,0.07)',
  borderRadius: '20px',
  padding: '22px',
}

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
  const progress = Math.round((currentIndex / questions.length) * 100)

  function handleSelect(label: string) {
    if (showFeedback) return
    setSelectedLabel(label)
    submitAnswer(label)
  }

  async function handleSimilar() {
    setLoadingSimilar(true)
    try {
      const body: Record<string, unknown> = { originalQuestion: currentQuestion.question, difficulty: config.difficulty, sourceText: sourceText || '' }
      if (fileBase64) { body.fileBase64 = fileBase64; body.fileType = fileType }
      const res = await fetch('/api/similar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSimilarQuestion(data.question)
      enterSimilarMode()
    } catch { alert('유사 문제 생성에 실패했습니다.') }
    finally { setLoadingSimilar(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* 진행 바 */}
      <div style={{ ...card, padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{
            fontSize: '12px', fontWeight: 700,
            background: isSimilarMode ? '#fee2e2' : '#f5f3ff',
            color: isSimilarMode ? '#b91c1c' : '#6d28d9',
            padding: '3px 11px', borderRadius: '100px',
          }}>
            {isSimilarMode ? '🔄 유사 문제' : `${currentIndex + 1} / ${questions.length}`}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed' }}>{progress}%</span>
        </div>
        <div style={{ height: '5px', background: '#f5f3ff', borderRadius: '100px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '100px',
            background: 'linear-gradient(90deg, #7c3aed, #3b82f6)',
            width: `${progress}%`, transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* 문제 카드 */}
      <div style={card}>
        <p style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.75, margin: '0 0 18px', color: '#3b2d6e', textAlign: 'center' }}>
          {currentQuestion.question}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {currentQuestion.options.map((opt) => {
            const isSelected = selectedLabel === opt.label
            const isCorrect = opt.label === currentQuestion.correctLabel
            let bg = '#fafafa'
            let border = '1.5px solid #ede9fe'
            let color = '#4c3a8a'
            let shadow = 'none'

            if (showFeedback) {
              if (isCorrect) { bg = '#f0fdf4'; border = '2px solid #6ee7b7'; color = '#065f46'; shadow = '0 2px 8px rgba(16,185,129,0.12)' }
              else if (isSelected) { bg = '#fef2f2'; border = '2px solid #fca5a5'; color = '#b91c1c' }
              else { bg = '#fafafa'; color = '#d1c4e9'; border = '1.5px solid #f3f0ff' }
            } else if (isSelected) {
              bg = '#f5f3ff'; border = '2px solid #7c3aed'; color = '#6d28d9'; shadow = '0 2px 10px rgba(124,58,237,0.12)'
            }

            return (
              <button key={opt.label} onClick={() => handleSelect(opt.label)} disabled={showFeedback} style={{
                display: 'flex', alignItems: 'center', gap: '11px',
                padding: '12px 14px', borderRadius: '12px',
                border, background: bg, color,
                boxShadow: shadow,
                cursor: showFeedback ? 'default' : 'pointer',
                textAlign: 'left', fontSize: '14px', fontWeight: 500,
                transition: 'all 0.15s', width: '100%',
              }}>
                <span style={{
                  width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                  background: showFeedback && isCorrect ? '#d1fae5' : showFeedback && isSelected ? '#fee2e2' : '#ede9fe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '11px', color,
                }}>{opt.label}</span>
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
          ...card,
          background: lastAnswer.isCorrect ? '#f0fdf4' : '#fef2f2',
          border: lastAnswer.isCorrect ? '1.5px solid #6ee7b7' : '1.5px solid #fca5a5',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '26px' }}>{lastAnswer.isCorrect ? '🎉' : '😅'}</span>
            <p style={{ margin: '5px 0 0', fontWeight: 800, fontSize: '17px', color: lastAnswer.isCorrect ? '#065f46' : '#b91c1c' }}>
              {lastAnswer.isCorrect ? '정답!' : '오답'}
            </p>
          </div>

          <div style={{
            background: '#fff', borderRadius: '12px', padding: '13px',
            fontSize: '13px', color: '#4c3a8a', lineHeight: 1.75, textAlign: 'left',
            border: '1px solid #f3f0ff',
          }}>
            <p style={{ margin: '0 0 5px', fontWeight: 700, fontSize: '11px', color: '#a78bfa', letterSpacing: '0.5px' }}>📖 해설</p>
            {currentQuestion.explanation}
          </div>

          {!lastAnswer.isCorrect && !isSimilarMode && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={handleSimilar} disabled={loadingSimilar} style={{
                flex: 1, padding: '12px', borderRadius: '12px',
                background: loadingSimilar ? '#f9fafb' : '#fffbeb',
                border: '1.5px solid #fde68a',
                color: '#b45309', fontWeight: 700, fontSize: '13px',
                cursor: loadingSimilar ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}>{loadingSimilar ? '생성 중...' : '🔄 유사 문제 풀기'}</button>
              <button onClick={() => exitSimilarMode()} style={{
                flex: 1, padding: '12px', borderRadius: '12px',
                background: '#fafafa', border: '1.5px solid #e0d7ff',
                color: '#7c3aed', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              }}>⏭ 패스</button>
            </div>
          )}

          {(lastAnswer.isCorrect || isSimilarMode) && (
            <button onClick={nextQuestion} style={{
              width: '100%', padding: '14px', marginTop: '12px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              border: 'none',
              color: '#fff', fontWeight: 800, fontSize: '14px', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
            }}>
              {currentIndex + 1 >= questions.length && !isSimilarMode ? '결과 보기 →' : '다음 문제 →'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
