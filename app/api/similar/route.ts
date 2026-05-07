import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Difficulty } from '@/types'

const DIFFICULTY_PROMPT: Record<Difficulty, string> = {
  easy: '초등학생도 이해할 수 있는 기본 개념 확인 수준',
  normal: '중고등학생 수준의 응용 및 이해 확인 수준',
  hard: '대학생 이상 수준의 심화 및 추론 수준',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { originalQuestion, difficulty, sourceText } = body

    if (!originalQuestion || !difficulty || !sourceText) {
      return NextResponse.json({ error: '필수 파라미터가 없습니다.' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `다음 문제와 같은 개념을 다루지만 다른 방식으로 묻는 유사 문제 1개를 생성해줘.

원래 문제: ${originalQuestion}
난이도: ${DIFFICULTY_PROMPT[difficulty as Difficulty]}

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
${String(sourceText).slice(0, 2000)}`

    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()

    const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/) || raw.match(/(\{[\s\S]*\})/)
    const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : raw
    const question = JSON.parse(jsonStr)

    return NextResponse.json({ question })
  } catch (err) {
    console.error('[similar] error:', err)
    return NextResponse.json({ error: '유사 문제 생성에 실패했습니다.' }, { status: 500 })
  }
}
