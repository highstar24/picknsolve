import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Difficulty, QuizQuestion } from '@/types'

const DIFFICULTY_PROMPT: Record<Difficulty, string> = {
  easy: '초등학생도 이해할 수 있는 기본 개념 확인 수준',
  normal: '중고등학생 수준의 응용 및 이해 확인 수준',
  hard: '대학생 이상 수준의 심화 및 추론 수준',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, difficulty, count, fileBase64, fileType, isSimilar, originalQuestion } = body

    // 입력 검증
    if (!difficulty || !['easy', 'normal', 'hard'].includes(difficulty)) {
      return NextResponse.json({ error: '난이도가 올바르지 않습니다.' }, { status: 400 })
    }
    if (!count || count < 1 || count > 20) {
      return NextResponse.json({ error: '문항 수는 1~20 사이여야 합니다.' }, { status: 400 })
    }
    if (!text && !fileBase64) {
      return NextResponse.json({ error: '학습 자료가 없습니다.' }, { status: 400 })
    }
    if (text && text.length > 10000) {
      return NextResponse.json({ error: '텍스트는 10,000자 이하여야 합니다.' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    let prompt: string

    if (isSimilar) {
      prompt = buildSimilarPrompt(originalQuestion, difficulty, text ?? '')
    } else {
      prompt = buildQuizPrompt(difficulty, count)
    }

    let result
    if (fileBase64 && fileType) {
      // 이미지 또는 PDF를 멀티모달로 전달
      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: fileType,
            data: fileBase64,
          },
        },
      ])
    } else {
      result = await model.generateContent(prompt + '\n\n학습 자료:\n' + (text ?? ''))
    }

    const raw = result.response.text().trim()
    const parsed = extractJson(raw)

    if (isSimilar) {
      return NextResponse.json({ question: parsed })
    }
    return NextResponse.json({ questions: parsed })
  } catch (err) {
    console.error('[generate] error:', err)
    return NextResponse.json({ error: '문제 생성에 실패했습니다. 다시 시도해 주세요.' }, { status: 500 })
  }
}

function buildQuizPrompt(difficulty: Difficulty, count: number): string {
  return `다음 학습 자료를 바탕으로 5지 선다형 문제를 ${count}개 생성해줘.

난이도: ${DIFFICULTY_PROMPT[difficulty]}

규칙:
1. 반드시 JSON 배열 형식으로만 응답 (다른 텍스트 없이)
2. 보기는 A~E 5개, 정답은 correctLabel에 'A'~'E' 중 하나
3. explanation은 정답 근거 + 오답 이유를 난이도에 맞게 설명

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
]`
}

function buildSimilarPrompt(originalQuestion: string, difficulty: Difficulty, sourceText: string): string {
  return `다음 문제와 같은 개념을 다루지만 다른 방식으로 묻는 유사 문제 1개를 생성해줘.

원래 문제: ${originalQuestion}
난이도: ${DIFFICULTY_PROMPT[difficulty]}

반드시 JSON 객체 형식으로만 응답 (배열 아님, 다른 텍스트 없이):
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
${sourceText.slice(0, 2000)}`
}

function extractJson(raw: string): unknown {
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/) || raw.match(/([\[{][\s\S]*[\]}])/)
  const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : raw
  return JSON.parse(jsonStr)
}
