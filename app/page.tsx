'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/store/quizStore'
import { validateFile } from '@/lib/extractText'
import { hasRemaining, getRemainingCount, incrementCount, LIMIT } from '@/lib/rateLimit'
import type { Difficulty, QuizQuestion } from '@/types'

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; desc: string; color: string; bg: string }[] = [
  { value: 'easy', label: '쉬움', desc: '개념 확인', color: '#1a1a1a', bg: '#A6E553' },
  { value: 'normal', label: '보통', desc: '응용·이해', color: '#1a1a1a', bg: '#FFAB39' },
  { value: 'hard', label: '어려움', desc: '심화·추론', color: '#fff', bg: '#F25A79' },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* 히어로 */}
      <div style={{
        background: '#FFFD87',
        border: '2px solid #1a1a1a',
        borderRadius: '20px',
        padding: '28px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-20px', right: '-20px',
          width: '120px', height: '120px', borderRadius: '50%',
          background: '#F25A79', opacity: 0.3,
        }} />
        <div style={{
          position: 'absolute', bottom: '-30px', right: '60px',
          width: '80px', height: '80px', borderRadius: '50%',
          background: '#6698E6', opacity: 0.4,
        }} />
        <h1 style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1.3, margin: 0, letterSpacing: '-0.5px' }}>
          내 자료로<br />퀴즈 만들기 ✨
        </h1>
        <p style={{ fontSize: '14px', color: '#555', marginTop: '8px', marginBottom: '0' }}>
          텍스트·이미지·PDF를 올리면 AI가 문제를 생성해요
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: '#fff', border: '1.5px solid #1a1a1a',
          borderRadius: '100px', padding: '4px 12px',
          fontSize: '12px', fontWeight: 600, marginTop: '12px',
        }}>
          📅 오늘 남은 횟수 <strong style={{ color: '#6698E6' }}>{remaining}/{LIMIT}</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* 입력 방식 카드 */}
        <div style={{
          background: '#fff', border: '2px solid #1a1a1a',
          borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          {/* 탭 */}
          <div style={{ display: 'flex', gap: '8px', background: '#f3f3f3', borderRadius: '12px', padding: '4px' }}>
            {(['text', 'file'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setInputType(t)}
                style={{
                  flex: 1, padding: '8px', borderRadius: '9px', border: 'none',
                  fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                  background: inputType === t ? '#6698E6' : 'transparent',
                  color: inputType === t ? '#fff' : '#777',
                  transition: 'all 0.15s',
                }}
              >
                {t === 'text' ? '✏️ 텍스트 입력' : '📎 파일 업로드'}
              </button>
            ))}
          </div>

          {inputType === 'text' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="공부할 내용을 여기에 붙여넣으세요. (최대 10,000자)"
                maxLength={10000}
                style={{
                  width: '100%', height: '160px', padding: '14px',
                  border: '1.5px solid #e0e0e0', borderRadius: '12px',
                  fontSize: '14px', resize: 'none', outline: 'none',
                  fontFamily: 'inherit', lineHeight: 1.6,
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#6698E6'}
                onBlur={e => e.target.style.borderColor = '#e0e0e0'}
              />
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#aaa' }}>
                {text.length.toLocaleString()} / 10,000
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: '2px dashed #ccc', borderRadius: '14px',
                  padding: '36px 20px', textAlign: 'center', cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: file ? '#f0fff0' : '#fafafa',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#6698E6')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#ccc')}
              >
                {file ? (
                  <>
                    <div style={{ fontSize: '28px' }}>✅</div>
                    <div style={{ fontWeight: 700, marginTop: '6px' }}>{file.name}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '32px' }}>📂</div>
                    <div style={{ fontWeight: 700, marginTop: '8px', color: '#444' }}>클릭하여 파일 선택</div>
                    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
                      JPG · PNG · WEBP · PDF · TXT (10MB 이하)
                    </div>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.txt" style={{ display: 'none' }} onChange={handleFileChange} />
              {fileError && <p style={{ fontSize: '13px', color: '#F25A79', margin: 0 }}>{fileError}</p>}
            </div>
          )}
        </div>

        {/* 난이도 */}
        <div style={{
          background: '#fff', border: '2px solid #1a1a1a',
          borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '15px' }}>난이도</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDifficulty(opt.value)}
                style={{
                  padding: '14px 8px', borderRadius: '14px', cursor: 'pointer',
                  border: difficulty === opt.value ? '2.5px solid #1a1a1a' : '2px solid transparent',
                  background: difficulty === opt.value ? opt.bg : '#f5f5f5',
                  color: difficulty === opt.value ? opt.color : '#888',
                  fontWeight: 700, fontSize: '14px',
                  transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                }}
              >
                <span>{opt.label}</span>
                <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.8 }}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 문항 수 */}
        <div style={{
          background: '#fff', border: '2px solid #1a1a1a',
          borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '15px' }}>문항 수</p>
            <span style={{
              fontSize: '28px', fontWeight: 800, color: '#6698E6', letterSpacing: '-1px',
            }}>{count}<span style={{ fontSize: '14px', fontWeight: 600, color: '#aaa', marginLeft: '2px' }}>문항</span></span>
          </div>
          <input
            type="range" min={1} max={20} value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#6698E6', height: '4px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#bbb' }}>
            <span>1문항</span><span>10문항</span><span>20문항</span>
          </div>
        </div>

        {error && (
          <div style={{
            background: '#fff0f3', border: '1.5px solid #F25A79',
            borderRadius: '12px', padding: '12px 16px', fontSize: '13px', color: '#c0384f',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || remaining === 0}
          style={{
            width: '100%', padding: '18px',
            background: loading || remaining === 0 ? '#ddd' : '#1a1a1a',
            color: loading || remaining === 0 ? '#aaa' : '#FFFD87',
            border: 'none', borderRadius: '16px',
            fontWeight: 800, fontSize: '16px', cursor: loading || remaining === 0 ? 'not-allowed' : 'pointer',
            letterSpacing: '-0.3px', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (!loading && remaining > 0) e.currentTarget.style.background = '#333' }}
          onMouseLeave={e => { if (!loading && remaining > 0) e.currentTarget.style.background = '#1a1a1a' }}
        >
          {loading ? '⏳ 문제 생성 중...' : '✨ 문제 생성하기'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#bbb', margin: 0 }}>
          PDF는 20페이지 이하, 파일은 10MB 이하를 권장합니다
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
