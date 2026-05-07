'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/store/quizStore'

const SCORE_MESSAGES = [
  { min: 90, emoji: '🏆', message: '완벽해요! 이 자료는 완전히 마스터했습니다.' },
  { min: 70, emoji: '🎉', message: '잘했어요! 몇 가지만 더 확인하면 완벽합니다.' },
  { min: 50, emoji: '💪', message: '절반은 알고 있어요! 오답을 다시 복습해 보세요.' },
  { min: 0, emoji: '📖', message: '더 공부가 필요해요. 자료를 다시 읽어보세요.' },
]

function getScoreMessage(score: number) {
  return SCORE_MESSAGES.find((m) => score >= m.min) ?? SCORE_MESSAGES[SCORE_MESSAGES.length - 1]
}

export default function ResultPage() {
  const router = useRouter()
  const { questions, answers, config, reset } = useQuizStore()

  useEffect(() => {
    if (questions.length === 0) {
      router.replace('/')
    }
  }, [questions.length, router])

  if (questions.length === 0) return null

  // answers 중 originalQuestion answers만 (유사 문제 제외 — id 999 제외)
  const mainAnswers = answers.filter((a) => a.questionId !== 999)
  const correctCount = mainAnswers.filter((a) => a.isCorrect).length
  const score = Math.round((correctCount / questions.length) * 100)
  const { emoji, message } = getScoreMessage(score)

  const DIFFICULTY_LABEL: Record<string, string> = {
    easy: '쉬움',
    normal: '보통',
    hard: '어려움',
  }

  function handleReset() {
    reset()
    router.push('/')
  }

  return (
    <div className="space-y-6">
      {/* 점수 카드 */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center space-y-3">
        <div className="text-5xl">{emoji}</div>
        <div className="text-5xl font-bold text-blue-600">{score}점</div>
        <p className="text-slate-600">{message}</p>
        <div className="flex justify-center gap-4 text-sm text-slate-500 pt-2">
          <span>✅ 정답 <strong className="text-green-600">{correctCount}</strong></span>
          <span>❌ 오답 <strong className="text-red-500">{questions.length - correctCount}</strong></span>
          <span>📝 총 <strong>{questions.length}</strong>문항</span>
          <span>🎯 난이도 <strong>{DIFFICULTY_LABEL[config.difficulty]}</strong></span>
        </div>
      </div>

      {/* 문제별 결과 */}
      <div className="space-y-3">
        <h2 className="font-bold text-slate-700 text-lg">문제별 결과</h2>
        {questions.map((q, i) => {
          const answer = mainAnswers.find((a) => a.questionId === q.id)
          const isCorrect = answer?.isCorrect ?? false
          const selectedLabel = answer?.selectedLabel
          const correctOpt = q.options.find((o) => o.label === q.correctLabel)
          const selectedOpt = q.options.find((o) => o.label === selectedLabel)

          return (
            <div
              key={q.id}
              className={`bg-white rounded-2xl p-5 border-2 ${
                isCorrect ? 'border-green-100' : 'border-red-100'
              } shadow-sm`}
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 text-xl">{isCorrect ? '✅' : '❌'}</span>
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium text-slate-800">
                    <span className="text-slate-400 mr-1">Q{i + 1}.</span>
                    {q.question}
                  </p>

                  {!isCorrect && (
                    <div className="text-xs space-y-1">
                      <p className="text-red-500">
                        내 답: <span className="font-medium">{selectedLabel}. {selectedOpt?.text ?? '미선택'}</span>
                      </p>
                      <p className="text-green-600">
                        정답: <span className="font-medium">{q.correctLabel}. {correctOpt?.text}</span>
                      </p>
                    </div>
                  )}

                  <details className="text-xs">
                    <summary className="cursor-pointer text-slate-400 hover:text-slate-600 select-none">
                      해설 보기
                    </summary>
                    <p className="mt-2 text-slate-600 leading-relaxed pl-2 border-l-2 border-slate-200">
                      {q.explanation}
                    </p>
                  </details>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 액션 버튼 */}
      <div className="space-y-2 pb-8">
        <button
          onClick={handleReset}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl transition-colors"
        >
          🔁 새 퀴즈 만들기
        </button>
      </div>
    </div>
  )
}
