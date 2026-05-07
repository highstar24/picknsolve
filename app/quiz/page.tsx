'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/store/quizStore'
import type { QuizQuestion } from '@/types'

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.5)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1.5px solid rgba(255,255,255,0.75)',
  boxShadow: '0 4px 24px rgba(160,120,220,0.08)',
  borderRadius: '22px',
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
            background: isSimilarMode ? 'rgba(246,188,186,0.4)' : 'rgba(200,168,233,0.25)',
            color: isSimilarMode ? '#c05050' : '#8b6ab0',
            padding: '3px 11px', borderRadius: '100px',
          }}>
            {isSimilarMode ? '🔄 유사 문제' : `${currentIndex + 1} / ${questions.length}`}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#a080c8' }}>{progress}%</span>
        </div>
        <div style={{ height: '5px', background: 'rgba(200,168,233,0.18)', borderRadius: '100px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '100px',
            background: 'linear-gradient(90deg, #dba8f0, #b8b4f0)',
            width: `${progress}%`, transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* 문제 카드 */}
      <div style={card}>
        <p style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.7, margin: '0 0 18px', color: '#5b3f8a', textAlign: 'center' }}>
          {currentQuestion.question}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {currentQuestion.options.map((opt) => {
            const isSelected = selectedLabel === opt.label
            const isCorrect = opt.label === currentQuestion.correctLabel
            let bg = 'rgba(255,255,255,0.55)'
            let border = '1.5px solid rgba(210,195,235,0.45)'
            let color = '#6b4fa0'
            let shadow = 'none'

            if (showFeedback) {
              if (isCorrect) { bg = 'rgba(164,228,160,0.45)'; border = '2px solid rgba(100,180,100,0.5)'; color = '#2d6e2d'; shadow = '0 3px 10px rgba(100,200,100,0.15)' }
              else if (isSelected) { bg = 'rgba(246,188,186,0.45)'; border = '2px solid rgba(220,100,100,0.45)'; color = '#a03030' }
              else { bg = 'rgba(255,255,255,0.2)'; color = '#c0b0d8'; border = '1.5px solid rgba(210,195,235,0.25)' }
            } else if (isSelected) {
              bg = 'rgba(200,168,233,0.3)'; border = '2px solid rgba(180,140,220,0.6)'; color = '#6b4fa0'; shadow = '0 3px 10px rgba(150,100,200,0.12)'
            }

            return (
              <button key={opt.label} onClick={() => handleSelect(opt.label)} disabled={showFeedback} style={{
                display: 'flex', alignItems: 'center', gap: '11px',
                padding: '12px 14px', borderRadius: '13px',
                border, background: bg, color,
                boxShadow: shadow,
                cursor: showFeedback ? 'default' : 'pointer',
                textAlign: 'left', fontSize: '14px', fontWeight: 500,
                transition: 'all 0.15s', width: '100%',
                backdropFilter: 'blur(10px)',
              }}>
                <span style={{
                  width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                  background: showFeedback && isCorrect ? 'rgba(100,180,100,0.25)' : 'rgba(255,255,255,0.7)',
                  border: `1.5px solid ${border.split(' ')[2]}`,
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
          background: lastAnswer.isCorrect ? 'rgba(200,240,200,0.42)' : 'rgba(246,188,186,0.38)',
          border: lastAnswer.isCorrect ? '1.5px solid rgba(150,220,150,0.55)' : '1.5px solid rgba(246,188,186,0.65)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '26px' }}>{lastAnswer.isCorrect ? '🎉' : '😅'}</span>
            <p style={{ margin: '5px 0 0', fontWeight: 800, fontSize: '17px', color: lastAnswer.isCorrect ? '#2d6e2d' : '#a03030' }}>
              {lastAnswer.isCorrect ? '정답!' : '오답'}
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.55)', borderRadius: '13px', padding: '13px',
            fontSize: '13px', color: '#6b4fa0', lineHeight: 1.75, textAlign: 'left',
          }}>
            <p style={{ margin: '0 0 5px', fontWeight: 700, fontSize: '11px', color: '#b0a0c8', letterSpacing: '0.5px' }}>📖 해설</p>
            {currentQuestion.explanation}
          </div>

          {!lastAnswer.isCorrect && !isSimilarMode && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={handleSimilar} disabled={loadingSimilar} style={{
                flex: 1, padding: '12px', borderRadius: '13px',
                background: loadingSimilar ? 'rgba(255,255,255,0.3)' : 'rgba(255,220,100,0.4)',
                border: '1.5px solid rgba(230,190,50,0.55)',
                color: '#7a5a00', fontWeight: 700, fontSize: '13px', cursor: loadingSimilar ? 'not-allowed' : 'pointer',
              }}>{loadingSimilar ? '생성 중...' : '🔄 유사 문제 풀기'}</button>
              <button onClick={() => exitSimilarMode()} style={{
                flex: 1, padding: '12px', borderRadius: '13px',
                background: 'rgba(255,255,255,0.45)', border: '1.5px solid rgba(200,168,233,0.4)',
                color: '#9b8ab0', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              }}>⏭ 패스</button>
            </div>
          )}

          {(lastAnswer.isCorrect || isSimilarMode) && (
            <button onClick={nextQuestion} style={{
              width: '100%', padding: '14px', marginTop: '12px', borderRadius: '13px',
              background: 'linear-gradient(135deg, #c8a8e9, #b8b4f0)',
              border: '1.5px solid rgba(255,255,255,0.7)',
              color: '#fff', fontWeight: 800, fontSize: '14px', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(200,168,233,0.35)',
            }}>
              {currentIndex + 1 >= questions.length && !isSimilarMode ? '결과 보기 →' : '다음 문제 →'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
