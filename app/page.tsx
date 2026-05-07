'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/store/quizStore'
import { validateFile } from '@/lib/extractText'
import { hasRemaining, getRemainingCount, incrementCount, LIMIT } from '@/lib/rateLimit'
import type { Difficulty, QuizQuestion } from '@/types'

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; desc: string; grad: string }[] = [
  { value: 'easy',   label: '쉬움',   desc: '개념 확인', grad: 'linear-gradient(135deg,#d4f5c8,#a8e8a0)' },
  { value: 'normal', label: '보통',   desc: '응용·이해', grad: 'linear-gradient(135deg,#fde68a,#fbbf24)' },
  { value: 'hard',   label: '어려움', desc: '심화·추론', grad: 'linear-gradient(135deg,#F6BCBA,#f87171)' },
]

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.45)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1.5px solid rgba(255,255,255,0.7)',
  boxShadow: '0 8px 32px rgba(150,100,200,0.12)',
  borderRadius: '24px',
  padding: '24px',
}

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
    if (!hasRemaining()) { setError(`오늘의 생성 횟수(${LIMIT}회)를 모두 사용했습니다.`); return }
    const hasContent = inputType === 'text' ? text.trim().length > 0 : file !== null
    if (!hasContent) { setError(inputType === 'text' ? '학습 자료를 입력해 주세요.' : '파일을 업로드해 주세요.'); return }

    setLoading(true)
    try {
      let body: Record<string, unknown>
      let sourceText = '', fileBase64 = '', fileType = ''

      if (inputType === 'file' && file) {
        if (file.type === 'text/plain') {
          sourceText = (await file.text()).slice(0, 10000)
          body = { text: sourceText, difficulty, count }
        } else {
          fileBase64 = await toBase64(file); fileType = file.type
          body = { fileBase64, fileType, difficulty, count }
        }
      } else {
        sourceText = text.slice(0, 10000)
        body = { text: sourceText, difficulty, count }
      }

      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '문제 생성에 실패했습니다.')
      setSession(data.questions as QuizQuestion[], { difficulty, count }, sourceText, fileBase64, fileType)
      incrementCount()
      router.push('/quiz')
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>

      {/* 히어로 */}
      <div style={{ ...glassCard, padding: '36px 24px' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🍀</div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#2d1b4e', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          내 자료로 퀴즈 만들기
        </h1>
        <p style={{ fontSize: '14px', color: '#7a6090', margin: '0 0 16px' }}>
          텍스트·이미지·PDF를 올리면 AI가 문제를 생성해요
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'rgba(200,168,233,0.25)', border: '1px solid rgba(200,168,233,0.5)',
          borderRadius: '100px', padding: '6px 16px', fontSize: '13px', fontWeight: 600, color: '#6b4fa0',
        }}>
          📅 오늘 남은 횟수 <strong>{remaining}/{LIMIT}</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* 입력 방식 */}
        <div style={glassCard}>
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(200,168,233,0.15)', borderRadius: '14px', padding: '4px', marginBottom: '16px' }}>
            {(['text', 'file'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setInputType(t)} style={{
                flex: 1, padding: '9px', borderRadius: '11px', border: 'none',
                fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                background: inputType === t ? 'rgba(255,255,255,0.9)' : 'transparent',
                color: inputType === t ? '#6b4fa0' : '#9b8ab0',
                boxShadow: inputType === t ? '0 2px 8px rgba(150,100,200,0.15)' : 'none',
                transition: 'all 0.2s',
              }}>
                {t === 'text' ? '✏️ 텍스트 입력' : '📎 파일 업로드'}
              </button>
            ))}
          </div>

          {inputType === 'text' ? (
            <>
              <textarea value={text} onChange={(e) => setText(e.target.value)}
                placeholder="공부할 내용을 여기에 붙여넣으세요. (최대 10,000자)"
                maxLength={10000}
                style={{
                  width: '100%', height: '150px', padding: '14px',
                  background: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(200,168,233,0.4)',
                  borderRadius: '14px', fontSize: '14px', resize: 'none', outline: 'none',
                  fontFamily: 'inherit', lineHeight: 1.6, color: '#2d1b4e',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(200,168,233,0.8)'}
                onBlur={e => e.target.style.borderColor = 'rgba(200,168,233,0.4)'}
              />
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#b0a0c0', marginTop: '6px' }}>
                {text.length.toLocaleString()} / 10,000
              </div>
            </>
          ) : (
            <>
              <div onClick={() => fileRef.current?.click()} style={{
                border: '2px dashed rgba(200,168,233,0.5)', borderRadius: '16px',
                padding: '36px 20px', cursor: 'pointer',
                background: file ? 'rgba(200,233,200,0.2)' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(200,168,233,0.9)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(200,168,233,0.5)'}
              >
                {file ? (
                  <><div style={{ fontSize: '28px' }}>✅</div>
                    <div style={{ fontWeight: 700, color: '#2d1b4e', marginTop: '6px' }}>{file.name}</div>
                    <div style={{ fontSize: '12px', color: '#9b8ab0', marginTop: '2px' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div></>
                ) : (
                  <><div style={{ fontSize: '32px' }}>🌸</div>
                    <div style={{ fontWeight: 700, color: '#6b4fa0', marginTop: '8px' }}>클릭하여 파일 선택</div>
                    <div style={{ fontSize: '12px', color: '#b0a0c0', marginTop: '4px' }}>JPG · PNG · WEBP · PDF · TXT (10MB 이하)</div></>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.txt" style={{ display: 'none' }} onChange={handleFileChange} />
              {fileError && <p style={{ fontSize: '13px', color: '#e06060', margin: '8px 0 0' }}>{fileError}</p>}
            </>
          )}
        </div>

        {/* 난이도 */}
        <div style={glassCard}>
          <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: '15px', color: '#2d1b4e' }}>난이도 선택</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button key={opt.value} type="button" onClick={() => setDifficulty(opt.value)} style={{
                padding: '16px 8px', borderRadius: '16px', cursor: 'pointer',
                border: difficulty === opt.value ? '2px solid rgba(255,255,255,0.9)' : '2px solid transparent',
                background: difficulty === opt.value ? opt.grad : 'rgba(255,255,255,0.3)',
                fontWeight: 700, fontSize: '14px', color: '#2d1b4e',
                boxShadow: difficulty === opt.value ? '0 4px 16px rgba(150,100,200,0.2)' : 'none',
                transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              }}>
                <span>{opt.label}</span>
                <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.75 }}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 문항 수 */}
        <div style={glassCard}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#2d1b4e' }}>문항 수</p>
            <span style={{ fontSize: '32px', fontWeight: 900, color: '#8b5cf6', letterSpacing: '-1px' }}>
              {count}<span style={{ fontSize: '15px', fontWeight: 600, color: '#b0a0c0' }}>문항</span>
            </span>
          </div>
          <input type="range" min={1} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#C8A8E9' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#b0a0c0', marginTop: '6px' }}>
            <span>1</span><span>10</span><span>20</span>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(246,188,186,0.4)', border: '1.5px solid rgba(246,188,186,0.7)',
            borderRadius: '14px', padding: '12px 16px', fontSize: '13px', color: '#9b3030', textAlign: 'center',
          }}>{error}</div>
        )}

        <button type="submit" disabled={loading || remaining === 0} style={{
          width: '100%', padding: '18px',
          background: loading || remaining === 0
            ? 'rgba(200,168,233,0.3)'
            : 'linear-gradient(135deg, #C8A8E9, #C3C7F4)',
          color: loading || remaining === 0 ? '#b0a0c0' : '#fff',
          border: '1.5px solid rgba(255,255,255,0.7)',
          borderRadius: '18px', fontWeight: 800, fontSize: '16px',
          cursor: loading || remaining === 0 ? 'not-allowed' : 'pointer',
          letterSpacing: '-0.3px',
          boxShadow: loading || remaining === 0 ? 'none' : '0 8px 24px rgba(200,168,233,0.4)',
          transition: 'all 0.2s',
        }}>
          {loading ? '⏳ 문제 생성 중...' : '✨ 문제 생성하기'}
        </button>

        <p style={{ fontSize: '12px', color: '#b0a0c0', margin: 0, textAlign: 'center' }}>
          PDF는 20페이지 이하 · 파일은 10MB 이하 권장
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
