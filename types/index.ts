export type Difficulty = 'easy' | 'normal' | 'hard'

export interface QuizOption {
  label: string // 'A' | 'B' | 'C' | 'D' | 'E'
  text: string
}

export interface QuizQuestion {
  id: number
  question: string
  options: QuizOption[]
  correctLabel: string // 'A' ~ 'E'
  explanation: string
}

export interface QuizConfig {
  difficulty: Difficulty
  count: number
}

export interface QuizSession {
  questions: QuizQuestion[]
  config: QuizConfig
  sourceText: string
}

export interface QuizAnswer {
  questionId: number
  selectedLabel: string
  isCorrect: boolean
}

export interface SimilarQuestion {
  question: string
  options: QuizOption[]
  correctLabel: string
  explanation: string
}

export type UploadType = 'text' | 'image' | 'pdf'

export interface GenerateRequest {
  text: string
  difficulty: Difficulty
  count: number
}

export interface GenerateResponse {
  questions: QuizQuestion[]
}
