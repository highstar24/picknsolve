'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/store/quizStore'
import type { QuizQuestion } from '@/types'

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.45)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1.5px solid rgba(255,255,255,0.7)',
  boxShadow: '0 8px 32px rgba(150,100,200,0.12)',
  borderRadius: '24px',
  padding: '24px',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* 진행 바 */}
      <div style={{ ...glassCard, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{
            fontSize: '13px', fontWeight: 700,
            background: isSimilarMode ? 'rgba(246,188,186,0.5)' : 'rgba(200,168,233,0.3)',
            color: isSimilarMode ? '#a04040' : '#6b4fa0',
            padding: '3px 12px', borderRadius: '100px',
          }}>
            {isSimilarMode ? '🔄 유사 문제' : `${currentIndex + 1} / ${questions.length}`}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#6b4fa0' }}>{progress}%</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(200,168,233,0.2)', borderRadius: '100px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '100px',
            background: 'linear-gradient(90deg, #E3AADD, #C3C7F4)',
            width: `${progress}%`, transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* 문제 카드 */}
      <div style={glassCard}>
        <p style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.7, margin: '0 0 20px', color: '#2d1b4e', textAlign: 'center' }}>
          {currentQuestion.question}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {currentQuestion.options.map((opt) => {
            const isSelected = selectedLabel === opt.label
            const isCorrect = opt.label === currentQuestion.correctLabel
            let bg = 'rgba(255,255,255,0.5)'
            let border = '1.5px solid rgba(200,168,233,0.3)'
            let color = '#2d1b4e'
            let shadow = 'none'

            if (showFeedback) {
              if (isCorrect) { bg = 'rgba(164,228,160,0.5)'; border = '2px solid rgba(100,180,100,0.6)'; shadow = '0 4px 12px rgba(100,200,100,0.2)' }
              else if (isSelected) { bg = 'rgba(246,188,186,0.5)'; border = '2px solid rgba(220,100,100,0.5)'; color = '#9b3030' }
              else { bg = 'rgba(255,255,255,0.2)'; color = '#b0a0c0' }
            } else if (isSelected) {
              bg = 'rgba(200,168,233,0.35)'; border = '2px solid rgba(200,168,233,0.7)'; shadow = '0 4px 12px rgba(150,100,200,0.15)'
            }

            return (
              <button key={opt.label} onClick={() => handleSelect(opt.label)} disabled={showFeedback} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '13px 16px', borderRadius: '14px',
                border, background: bg, color,
                boxShadow: shadow,
                cursor: showFeedback ? 'default' : 'pointer',
                textAlign: 'left', fontSize: '14px', fontWeight: 500,
                transition: 'all 0.15s', width: '100%',
                backdropFilter: 'blur(10px)',
              }}>
                <span style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: showFeedback && isCorrect ? 'rgba(100,180,100,0.3)' : 'rgba(255,255,255,0.6)',
                  border: `1.5px solid ${color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '12px',
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
          ...glassCard,
          background: lastAnswer.isCorrect ? 'rgba(200,240,200,0.5)' : 'rgba(246,188,186,0.4)',
          border: lastAnswer.isCorrect ? '1.5px solid rgba(150,220,150,0.6)' : '1.5px solid rgba(246,188,186,0.7)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '28px' }}>{lastAnswer.isCorrect ? '🎉' : '😅'}</span>
            <p style={{ margin: '6px 0 0', fontWeight: 800, fontSize: '18px', color: '#2d1b4e' }}>
              {lastAnswer.isCorrect ? '정답!' : '오답'}
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.5)', borderRadius: '14px', padding: '14px',
            fontSize: '13px', color: '#4a3060', lineHeight: 1.7, textAlign: 'left',
          }}>
            <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '11px', color: '#9b8ab0', letterSpacing: '0.5px' }}>📖 해설</p>
            {currentQuestion.explanation}
          </div>

          {!lastAnswer.isCorrect && !isSimilarMode && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button onClick={handleSimilar} disabled={loadingSimilar} style={{
                flex: 1, padding: '13px', borderRadius: '14px',
                background: loadingSimilar ? 'rgba(255,255,255,0.3)' : 'rgba(255,220,100,0.5)',
                border: '1.5px solid rgba(255,200,50,0.6)',
                color: '#7a5000', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
              }}>{loadingSimilar ? '생성 중...' : '🔄 유사 문제 풀기'}</button>
              <button onClick={() => exitSimilarMode()} style={{
                flex: 1, padding: '13px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.4)', border: '1.5px solid rgba(200,168,233,0.4)',
                color: '#7a6090', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
              }}>⏭ 패스</button>
            </div>
          )}

          {(lastAnswer.isCorrect || isSimilarMode) && (
            <button onClick={nextQuestion} style={{
              width: '100%', padding: '14px', marginTop: '14px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #C8A8E9, #C3C7F4)',
              border: '1.5px solid rgba(255,255,255,0.7)',
              color: '#fff', fontWeight: 800, fontSize: '15px', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(200,168,233,0.4)',
            }}>
              {currentIndex + 1 >= questions.length && !isSimilarMode ? '결과 보기 →' : '다음 문제 →'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
