'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/store/quizStore'
import { T } from '@/lib/i18n'
import { playCorrect, playWrong } from '@/lib/sounds'
import type { QuizQuestion } from '@/types'

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(255,255,255,0.7)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
  borderRadius: '22px',
  padding: '22px',
}

export default function QuizPage() {
  const router = useRouter()
  const {
    questions, currentIndex, answers, showFeedback,
    similarQuestion, isSimilarMode, config, sourceText,
    fileBase64, fileType, usedSimilarIndices, uiLang, quizLangMode,
    submitAnswer, nextQuestion,
    setSimilarQuestion, enterSimilarMode, exitSimilarMode, markSimilarUsed,
  } = useQuizStore()
  const t = T[uiLang]

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
    const isCorrect = label === currentQuestion.correctLabel
    if (isCorrect) playCorrect()
    else playWrong()
  }

  const similarAlreadyUsed = usedSimilarIndices.has(currentIndex)

  async function handleSimilar() {
    setLoadingSimilar(true)
    try {
      const body: Record<string, unknown> = { originalQuestion: currentQuestion.question, difficulty: config.difficulty, sourceText: sourceText || '', quizLangMode, uiLang }
      if (fileBase64) { body.fileBase64 = fileBase64; body.fileType = fileType }
      const res = await fetch('/api/similar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      markSimilarUsed()
      setSimilarQuestion(data.question)
      enterSimilarMode()
    } catch { alert('유사 문제 생성에 실패했습니다.') }
    finally { setLoadingSimilar(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* 진행 바 */}
      <div style={{
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: '16px', padding: '14px 18px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{
            fontSize: '12px', fontWeight: 700,
            background: isSimilarMode ? 'rgba(237,205,68,0.25)' : 'rgba(255,255,255,0.2)',
            color: isSimilarMode ? '#EDCD44' : '#fff',
            padding: '3px 12px', borderRadius: '100px',
          }}>
            {isSimilarMode ? t.similarMode : `${currentIndex + 1} / ${questions.length}`}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#EDCD44' }}>{progress}%</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '100px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '100px',
            background: 'linear-gradient(90deg, #DC3E26, #EDCD44)',
            width: `${progress}%`, transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* 문제 카드 */}
      <div style={card}>
        <p style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.75, margin: '0 0 18px', color: '#0d2233', textAlign: 'center' }}>
          {currentQuestion.question}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {currentQuestion.options.map((opt) => {
            const isSelected = selectedLabel === opt.label
            const isCorrect = opt.label === currentQuestion.correctLabel
            let bg = '#f0f8fc'
            let border = '1.5px solid #b8e0e8'
            let color = '#0d3d52'
            let shadow = 'none'

            if (showFeedback) {
              if (isCorrect) { bg = '#f0fdf4'; border = '2px solid #34d399'; color = '#065f46'; shadow = '0 2px 8px rgba(52,211,153,0.2)' }
              else if (isSelected) { bg = '#fff1f2'; border = '2px solid #fda4af'; color = '#be123c' }
              else { bg = '#fafafa'; color = '#d8b4fe'; border = '1.5px solid #ddf0f4' }
            } else if (isSelected) {
              bg = 'rgba(220,62,38,0.08)'; border = '2px solid #DC3E26'; color = '#7c2d12'; shadow = '0 2px 10px rgba(220,62,38,0.2)'
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
                  width: '27px', height: '27px', borderRadius: '50%', flexShrink: 0,
                  background: showFeedback && isCorrect ? '#d1fae5'
                    : showFeedback && isSelected ? '#ffe4e6'
                    : isSelected ? 'rgba(220,62,38,0.15)'
                    : '#ddf0f4',
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
          background: lastAnswer.isCorrect ? 'rgba(240,253,244,0.97)' : 'rgba(255,241,242,0.97)',
          border: lastAnswer.isCorrect ? '1.5px solid #6ee7b7' : '1.5px solid #fda4af',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '28px' }}>{lastAnswer.isCorrect ? '🎉' : '😅'}</span>
            <p style={{
              margin: '5px 0 0', fontWeight: 900, fontSize: '18px',
              background: lastAnswer.isCorrect
                ? 'linear-gradient(135deg, #059669, #10b981)'
                : 'linear-gradient(135deg, #e11d48, #f43f5e)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {lastAnswer.isCorrect ? t.correct : t.wrong}
            </p>
          </div>

          <div style={{
            background: '#fff', borderRadius: '12px', padding: '13px',
            fontSize: '13px', color: '#0d3d52', lineHeight: 1.75, textAlign: 'left',
            border: '1px solid #ddf0f4',
          }}>
            <p style={{ margin: '0 0 5px', fontWeight: 700, fontSize: '11px', color: '#81CAD6', letterSpacing: '0.5px' }}>{t.explanationLabel}</p>
            {currentQuestion.explanation}
          </div>

          {!lastAnswer.isCorrect && !isSimilarMode && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              {similarAlreadyUsed ? (
                <div style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  background: '#fafafa', border: '1.5px solid #ddf0f4',
                  color: '#81CAD6', fontWeight: 600, fontSize: '13px',
                  textAlign: 'center',
                }}>
                  {t.similarDone}
                </div>
              ) : (
                <button onClick={handleSimilar} disabled={loadingSimilar} style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  background: loadingSimilar ? '#f9fafb' : 'linear-gradient(135deg, #DC3E26, #EDCD44)',
                  border: 'none',
                  color: '#fff', fontWeight: 700, fontSize: '13px',
                  cursor: loadingSimilar ? 'not-allowed' : 'pointer',
                  boxShadow: loadingSimilar ? 'none' : '0 4px 12px rgba(220,62,38,0.35)',
                  transition: 'all 0.2s',
                }}>{loadingSimilar ? t.similarLoading : t.similarBtn}</button>
              )}
              <button onClick={() => exitSimilarMode()} style={{
                flex: 1, padding: '12px', borderRadius: '12px',
                background: '#f0f8fc', border: '1.5px solid #b8e0e8',
                color: '#0a7fa0', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              }}>{t.passBtn}</button>
            </div>
          )}

          {(lastAnswer.isCorrect || isSimilarMode) && (
            <button onClick={nextQuestion} style={{
              width: '100%', padding: '14px', marginTop: '12px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #DC3E26, #EDCD44)',
              border: 'none',
              color: '#fff', fontWeight: 900, fontSize: '14px', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(220,62,38,0.4)',
              textShadow: '0 1px 4px rgba(0,0,0,0.1)',
            }}>
              {currentIndex + 1 >= questions.length && !isSimilarMode ? t.resultBtn : t.nextBtn}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
