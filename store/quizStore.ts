import { create } from 'zustand'
import type { QuizQuestion, QuizConfig, QuizAnswer, Difficulty } from '@/types'
import type { UiLang, QuizLangMode } from '@/lib/i18n'

interface QuizStore {
  // UI 언어 (KR/EN/ZH)
  uiLang: UiLang
  setUiLang: (lang: UiLang) => void

  // 문제 언어 모드
  quizLangMode: QuizLangMode
  setQuizLangMode: (mode: QuizLangMode) => void

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
  /** 유사 문제를 이미 생성한 원본 문제 인덱스 집합 */
  usedSimilarIndices: Set<number>

  // 액션
  setSession: (questions: QuizQuestion[], config: QuizConfig, sourceText: string, fileBase64?: string, fileType?: string) => void
  submitAnswer: (selectedLabel: string) => void
  nextQuestion: () => void
  setSimilarQuestion: (q: QuizQuestion | null) => void
  enterSimilarMode: () => void
  exitSimilarMode: () => void
  /** 현재 문제 인덱스를 유사 문제 사용 완료로 표시 */
  markSimilarUsed: () => void
  reset: () => void
}

const DEFAULT_CONFIG: QuizConfig = { difficulty: 'normal', count: 5 }

function loadUiLang(): UiLang {
  if (typeof window === 'undefined') return 'KR'
  return (localStorage.getItem('uiLang') as UiLang) ?? 'KR'
}

export const useQuizStore = create<QuizStore>((set, get) => ({
  uiLang: 'KR',
  setUiLang: (lang) => {
    localStorage.setItem('uiLang', lang)
    set({ uiLang: lang })
  },

  quizLangMode: 'source',
  setQuizLangMode: (mode) => set({ quizLangMode: mode }),

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
  usedSimilarIndices: new Set<number>(),

  setSession: (questions, config, sourceText, fileBase64 = '', fileType = '') =>
    set({ questions, config, sourceText, fileBase64, fileType, currentIndex: 0, answers: [], showFeedback: false, usedSimilarIndices: new Set<number>() }),

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

  markSimilarUsed: () => {
    const { currentIndex, usedSimilarIndices } = get()
    const next = new Set(usedSimilarIndices)
    next.add(currentIndex)
    set({ usedSimilarIndices: next })
  },

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
      usedSimilarIndices: new Set<number>(),
    }),
}))
