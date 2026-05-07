'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/store/quizStore'
import { validateFile } from '@/lib/extractText'
import { hasRemaining, getRemainingCount, incrementCount, LIMIT } from '@/lib/rateLimit'
import type { Difficulty, QuizQuestion } from '@/types'

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'easy', label: '쉬움', desc: '개념 확인 · 기초' },
  { value: 'normal', label: '보통', desc: '응용 · 이해' },
  { value: 'hard', label: '어려움', desc: '심화 · 추론' },
]

export default function HomePage() {
  const router = useRouter()
  const { setSession } = useQuizStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const [inputType, setInputType] = useState<'text' | 'file'>('text')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [count, setCount] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remaining = getRemainingCount()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const err = validateFile(f)
    setFileError(err)
    setFile(err ? null : f)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!hasRemaining()) {
      setError(`오늘의 생성 횟수(${LIMIT}회)를 모두 사용했습니다. 내일 다시 시도해 주세요.`)
      return
    }

    const hasContent = inputType === 'text' ? text.trim().length > 0 : file !== null
    if (!hasContent) {
      setError(inputType === 'text' ? '학습 자료를 입력해 주세요.' : '파일을 업로드해 주세요.')
      return
    }

    setLoading(true)
    try {
      let body: Record<string, unknown>
      let sourceText = ''
      let fileBase64 = ''
      let fileType = ''

      if (inputType === 'file' && file) {
        if (file.type === 'text/plain') {
          sourceText = (await file.text()).slice(0, 10000)
          body = { text: sourceText, difficulty, count }
        } else {
          fileBase64 = await toBase64(file)
          fileType = file.type
          body = { fileBase64, fileType, difficulty, count }
        }
      } else {
        sourceText = text.slice(0, 10000)
        body = { text: sourceText, difficulty, count }
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '문제 생성에 실패했습니다.')

      const questions: QuizQuestion[] = data.questions
      setSession(questions, { difficulty, count }, sourceText, fileBase64, fileType)
      incrementCount()
      router.push('/quiz')
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-800">내 자료로 퀴즈 만들기</h1>
        <p className="text-slate-500">텍스트, 이미지, PDF를 올리면 AI가 맞춤 문제를 만들어 드립니다.</p>
        <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm px-3 py-1.5 rounded-full">
          <span>📅</span>
          <span>오늘 남은 생성: <strong>{remaining}/{LIMIT}회</strong></span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 입력 방식 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <div className="flex gap-2">
            {(['text', 'file'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setInputType(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  inputType === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t === 'text' ? '✏️ 텍스트 입력' : '📎 파일 업로드'}
              </button>
            ))}
          </div>

          {inputType === 'text' ? (
            <div className="space-y-1.5">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="공부할 내용을 여기에 붙여넣으세요. (최대 10,000자)"
                className="w-full h-44 px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                maxLength={10000}
              />
              <div className="text-right text-xs text-slate-400">{text.length.toLocaleString()} / 10,000</div>
            </div>
          ) : (
            <div className="space-y-2">
              <div
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {file ? (
                  <div className="space-y-1">
                    <div className="text-2xl">✅</div>
                    <div className="font-medium text-slate-700">{file.name}</div>
                    <div className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-3xl">📂</div>
                    <div className="font-medium text-slate-600">클릭하여 파일 선택</div>
                    <div className="text-xs text-slate-400">JPG · PNG · WEBP · PDF · TXT (10MB 이하)</div>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,.txt"
                className="hidden"
                onChange={handleFileChange}
              />
              {fileError && <p className="text-sm text-red-500">{fileError}</p>}
            </div>
          )}
        </div>

        {/* 난이도 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
          <p className="text-sm font-medium text-slate-700">난이도</p>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDifficulty(opt.value)}
                className={`p-3 rounded-xl border-2 text-center transition-colors ${
                  difficulty === opt.value ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300'
                }`}
              >
                <div className={`font-bold text-sm ${difficulty === opt.value ? 'text-blue-600' : 'text-slate-700'}`}>
                  {opt.label}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 문항 수 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">문항 수</p>
            <span className="text-2xl font-bold text-blue-600">{count}문항</span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>1</span>
            <span>10</span>
            <span>20</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || remaining === 0}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-lg rounded-2xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <><span className="animate-spin inline-block">⏳</span> 문제 생성 중...</>
          ) : (
            <>✨ 문제 생성하기</>
          )}
        </button>

        <p className="text-center text-xs text-slate-400">
          빠른 분석을 위해 PDF는 20페이지 이하, 파일은 10MB 이하를 권장합니다.
        </p>
      </form>
    </div>
  )
}

async function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '')
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
