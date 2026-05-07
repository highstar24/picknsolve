import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Difficulty, QuizQuestion } from '@/types'

const DIFFICULTY_PROMPT: Record<Difficulty, string> = {
  easy: '초등학생도 이해할 수 있는 기본 개념 확인 수준',
  normal: '중고등학생 수준의 응용 및 이해 확인 수준',
  hard: '대학생 이상 수준의 심화 및 추론 수준',
}

export async function generateQuiz(
  text: string,
  difficulty: Difficulty,
  count: number
): Promise<QuizQuestion[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `
다음 학습 자료를 바탕으로 5지 선다형 문제를 ${count}개 생성해줘.

난이도: ${DIFFICULTY_PROMPT[difficulty]}

규칙:
1. 반드시 JSON 배열 형식으로만 응답해 (다른 텍스트 없이)
2. 각 문제는 아래 형식을 따를 것
3. 보기는 A~E 5개, 정답은 correctLabel에 'A'~'E' 중 하나
4. explanation은 정답 근거와 오답이 왜 틀렸는지 난이도에 맞게 설명

응답 형식:
[
  {
    "id": 1,
    "question": "문제 내용",
    "options": [
      {"label": "A", "text": "보기1"},
      {"label": "B", "text": "보기2"},
      {"label": "C", "text": "보기3"},
      {"label": "D", "text": "보기4"},
      {"label": "E", "text": "보기5"}
    ],
    "correctLabel": "A",
    "explanation": "해설 내용"
  }
]

학습 자료:
${text}
`

  const result = await model.generateContent(prompt)
  const raw = result.response.text().trim()

  // JSON 블록 추출 (```json ... ``` 형태 대응)
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/) || raw.match(/(\[[\s\S]*\])/)
  const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : raw

  const questions: QuizQuestion[] = JSON.parse(jsonStr)
  return questions
}

export async function generateSimilarQuestion(
  originalQuestion: string,
  difficulty: Difficulty,
  sourceText: string
): Promise<QuizQuestion> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `
다음 문제와 같은 개념을 다루지만 다른 방식으로 묻는 유사 문제 1개를 생성해줘.

원래 문제: ${originalQuestion}
난이도: ${DIFFICULTY_PROMPT[difficulty]}

반드시 JSON 객체 형식으로만 응답해 (배열 아님, 다른 텍스트 없이):
{
  "id": 999,
  "question": "문제 내용",
  "options": [
    {"label": "A", "text": "보기1"},
    {"label": "B", "text": "보기2"},
    {"label": "C", "text": "보기3"},
    {"label": "D", "text": "보기4"},
    {"label": "E", "text": "보기5"}
  ],
  "correctLabel": "A",
  "explanation": "해설 내용"
}

참고 학습 자료:
${sourceText.slice(0, 2000)}
`

  const result = await model.generateContent(prompt)
  const raw = result.response.text().trim()

  const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/) || raw.match(/(\{[\s\S]*\})/)
  const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : raw

  return JSON.parse(jsonStr)
}
