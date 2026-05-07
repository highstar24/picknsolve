'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/store/quizStore'
import type { QuizQuestion } from '@/types'

export default function QuizPage() {
  const router = useRouter()
  const {
    questions,
    currentIndex,
    answers,
    showFeedback,
    similarQuestion,
    isSimilarMode,
    config,
    sourceText,
    fileBase64,
    fileType,
    submitAnswer,
    nextQuestion,
    setSimilarQuestion,
    enterSimilarMode,
    exitSimilarMode,
  } = useQuizStore()

  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)

  const isFinished = currentIndex >= questions.length && !isSimilarMode

  useEffect(() => {
    if (questions.length === 0) {
      router.replace('/')
    }
  }, [questions.length, router])

  useEffect(() => {
    setSelectedLabel(null)
  }, [currentIndex, isSimilarMode])

  useEffect(() => {
    if (isFinished) {
      router.push('/result')
    }
  }, [isFinished, router])

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
      if (fileBase64) {
        body.fileBase64 = fileBase64
        body.fileType = fileType
      }

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
    <div className="space-y-5">
      {/* 진행 상태 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            {isSimilarMode ? '🔄 유사 문제' : `문제 ${currentIndex + 1} / ${totalCount}`}
          </span>
          <span className="font-medium text-slate-700">{progress}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {isSimilarMode && (
          <div className="text-xs text-center text-amber-600 bg-amber-50 rounded-lg py-1.5">
            오답 개념을 한 번 더 확인해 보세요!
          </div>
        )}
      </div>

      {/* 문제 카드 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
        <p className="text-lg font-semibold text-slate-800 leading-relaxed">
          {currentQuestion.question}
        </p>

        {/* 보기 */}
        <div className="space-y-2.5">
          {currentQuestion.options.map((opt) => {
            const isSelected = selectedLabel === opt.label
            const isCorrect = opt.label === currentQuestion.correctLabel
            let style = 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/30'

            if (showFeedback) {
              if (isCorrect) {
                style = 'bg-green-50 border-green-400 text-green-800'
              } else if (isSelected && !isCorrect) {
                style = 'bg-red-50 border-red-400 text-red-700'
              } else {
                style = 'bg-slate-50 border-slate-200 text-slate-400'
              }
            } else if (isSelected) {
              style = 'bg-blue-50 border-blue-400 text-blue-800'
            }

            return (
              <button
                key={opt.label}
                onClick={() => handleSelect(opt.label)}
                disabled={showFeedback}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-colors text-sm ${style}`}
              >
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white border border-current flex items-center justify-center font-bold text-xs">
                  {opt.label}
                </span>
                <span className="flex-1">{opt.text}</span>
                {showFeedback && isCorrect && <span className="flex-shrink-0">✅</span>}
                {showFeedback && isSelected && !isCorrect && <span className="flex-shrink-0">❌</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* 피드백 패널 */}
      {showFeedback && lastAnswer && (
        <div
          className={`rounded-2xl p-5 border space-y-4 ${
            lastAnswer.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{lastAnswer.isCorrect ? '🎉' : '😅'}</span>
            <span className={`font-bold text-lg ${lastAnswer.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {lastAnswer.isCorrect ? '정답입니다!' : '오답입니다.'}
            </span>
          </div>

          <div className="bg-white/70 rounded-xl p-4 text-sm text-slate-700 leading-relaxed">
            <p className="font-medium text-slate-500 text-xs mb-1.5">📖 해설</p>
            {currentQuestion.explanation}
          </div>

          {/* 오답 액션 */}
          {!lastAnswer.isCorrect && !isSimilarMode && (
            <div className="flex gap-2">
              <button
                onClick={handleSimilar}
                disabled={loadingSimilar}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-medium rounded-xl text-sm transition-colors"
              >
                {loadingSimilar ? '생성 중...' : '🔄 유사 문제 풀기'}
              </button>
              <button
                onClick={() => exitSimilarMode()}
                className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-xl text-sm transition-colors"
              >
                ⏭ 패스하기
              </button>
            </div>
          )}

          {/* 유사문제 완료 후 / 정답 후 다음 */}
          {(lastAnswer.isCorrect || isSimilarMode) && (
            <button
              onClick={nextQuestion}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-colors"
            >
              {currentIndex + 1 >= totalCount && !isSimilarMode ? '결과 보기 →' : '다음 문제 →'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
