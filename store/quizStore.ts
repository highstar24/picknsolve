import { create } from 'zustand'
import type { QuizQuestion, QuizConfig, QuizAnswer, Difficulty } from '@/types'

interface QuizStore {
  // 세션 데이터
  questions: QuizQuestion[]
  config: QuizConfig
  sourceText: string
  fileBase64: string
  fileType: string

  // 풀이 상태
  currentIndex: number
  answers: QuizAnswer[]
  showFeedback: boolean
  similarQuestion: QuizQuestion | null
  isSimilarMode: boolean

  // 액션
  setSession: (questions: QuizQuestion[], config: QuizConfig, sourceText: string, fileBase64?: string, fileType?: string) => void
  submitAnswer: (selectedLabel: string) => void
  nextQuestion: () => void
  setSimilarQuestion: (q: QuizQuestion | null) => void
  enterSimilarMode: () => void
  exitSimilarMode: () => void
  reset: () => void
}

const DEFAULT_CONFIG: QuizConfig = { difficulty: 'normal', count: 5 }

export const useQuizStore = create<QuizStore>((set, get) => ({
  questions: [],
  config: DEFAULT_CONFIG,
  sourceText: '',
  fileBase64: '',
  fileType: '',
  currentIndex: 0,
  answers: [],
  showFeedback: false,
  similarQuestion: null,
  isSimilarMode: false,

  setSession: (questions, config, sourceText, fileBase64 = '', fileType = '') =>
    set({ questions, config, sourceText, fileBase64, fileType, currentIndex: 0, answers: [], showFeedback: false }),

  submitAnswer: (selectedLabel) => {
    const { questions, currentIndex, answers, isSimilarMode, similarQuestion } = get()
    const question = isSimilarMode ? similarQuestion! : questions[currentIndex]
    const isCorrect = selectedLabel === question.correctLabel

    set({
      answers: [
        ...answers,
        { questionId: question.id, selectedLabel, isCorrect },
      ],
      showFeedback: true,
    })
  },

  nextQuestion: () => {
    const { currentIndex, questions, isSimilarMode } = get()

    if (isSimilarMode) {
      // 유사 문제 풀이 완료 → 원래 다음 문제로
      set({ isSimilarMode: false, similarQuestion: null, showFeedback: false, currentIndex: currentIndex + 1 })
      return
    }

    set({ currentIndex: currentIndex + 1, showFeedback: false })
  },

  setSimilarQuestion: (q) => set({ similarQuestion: q }),

  enterSimilarMode: () => set({ isSimilarMode: true, showFeedback: false }),

  exitSimilarMode: () => {
    const { currentIndex } = get()
    set({ isSimilarMode: false, similarQuestion: null, showFeedback: false, currentIndex: currentIndex + 1 })
  },

  reset: () =>
    set({
      questions: [],
      config: DEFAULT_CONFIG,
      sourceText: '',
      fileBase64: '',
      fileType: '',
      currentIndex: 0,
      answers: [],
      showFeedback: false,
      similarQuestion: null,
      isSimilarMode: false,
    }),
}))
