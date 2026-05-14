import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { LANG_NAME_FOR_PROMPT } from '@/lib/i18n'
import type { Difficulty } from '@/types'
import type { UiLang, QuizLangMode } from '@/lib/i18n'

const DIFFICULTY_PROMPT: Record<Difficulty, string> = {
  easy: '초등학생도 이해할 수 있는 기본 개념 확인 수준',
  normal: '중고등학생 수준의 응용 및 이해 확인 수준',
  hard: '대학생 이상 수준의 심화 및 추론 수준',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { originalQuestion, difficulty, sourceText, quizLangMode, uiLang } = body

    if (!originalQuestion || !difficulty) {
      return NextResponse.json({ error: '필수 파라미터가 없습니다.' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 })
    }

    const mode: QuizLangMode = quizLangMode === 'translate' ? 'translate' : 'source'
    const lang: UiLang = ['KR', 'EN', 'ZH'].includes(uiLang) ? uiLang : 'KR'

    const langRule = mode === 'translate'
      ? `언어: 문제·해설은 ${LANG_NAME_FOR_PROMPT[lang]}로, 보기는 원래 문제와 동일한 언어로 작성`
      : `언어: 원래 문제와 동일한 언어로 작성`

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `다음 문제와 같은 개념을 다루지만 다른 방식으로 묻는 유사 문제 1개를 생성해줘.

원래 문제: ${originalQuestion}
난이도: ${DIFFICULTY_PROMPT[difficulty as Difficulty]}
${langRule}

반드시 아래 JSON 객체 형식으로만 응답해. 코드블록, 설명 텍스트 없이 JSON만 출력:
{
  "id": 999,
  "question": "문제 내용",
  "options": [
    {"label": "1", "text": "보기1"},
    {"label": "2", "text": "보기2"},
    {"label": "3", "text": "보기3"},
    {"label": "4", "text": "보기4"},
    {"label": "5", "text": "보기5"}
  ],
  "correctLabel": "1",
  "explanation": "해설 내용"
}

참고 학습 자료:
${String(sourceText ?? '').slice(0, 2000)}`

    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()

    const question = extractJson(raw)
    if (!question || typeof question !== 'object') {
      throw new Error('유효하지 않은 응답 형식')
    }

    return NextResponse.json({ question })
  } catch (err) {
    console.error('[similar] error:', err)
    return NextResponse.json({ error: '유사 문제 생성에 실패했습니다.' }, { status: 500 })
  }
}

function extractJson(raw: string): unknown {
  // 코드블록 안의 JSON 추출
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (codeBlock?.[1]) {
    try { return JSON.parse(codeBlock[1]) } catch { /* continue */ }
  }
  // 중괄호로 감싸진 JSON 추출
  const objMatch = raw.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try { return JSON.parse(objMatch[0]) } catch { /* continue */ }
  }
  // 원문 그대로 시도
  try { return JSON.parse(raw) } catch { /* continue */ }
  return null
}
