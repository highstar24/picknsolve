'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/store/quizStore'
import { validateFile } from '@/lib/extractText'
import { hasRemaining, getRemainingCount, incrementCount, LIMIT } from '@/lib/rateLimit'
import type { Difficulty, QuizQuestion } from '@/types'

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; desc: string; activeColor: string; activeBg: string }[] = [
  { value: 'easy',   label: '쉬움',   desc: '개념 확인', activeColor: '#059669', activeBg: '#d1fae5' },
  { value: 'normal', label: '보통',   desc: '응용·이해', activeColor: '#d97706', activeBg: '#fef3c7' },
  { value: 'hard',   label: '어려움', desc: '심화·추론', activeColor: '#dc2626', activeBg: '#fee2e2' },
]

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid rgba(220,215,255,0.6)',
  boxShadow: '0 2px 16px rgba(120,80,220,0.07)',
  borderRadius: '20px',
  padding: '22px',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* 히어로 */}
      <div style={{
        ...card,
        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)',
        border: 'none',
        padding: '32px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 카드 내부 블롭 장식 */}
        <div style={{
          position: 'absolute', top: '-30px', right: '-20px',
          width: '140px', height: '140px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '60% 40% 50% 50% / 40% 60% 40% 60%',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20px', left: '-10px',
          width: '100px', height: '100px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '50% 60% 40% 50% / 60% 40% 60% 40%',
        }} />
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.5px', position: 'relative' }}>
          내 자료로 퀴즈 만들기
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: '0 0 16px', position: 'relative' }}>
          텍스트 이미지 PDF를 올리면 문제가 생성돼요
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'rgba(255,255,255,0.18)',
          borderRadius: '100px', padding: '5px 14px',
          fontSize: '12px', fontWeight: 600, color: '#fff',
          position: 'relative',
        }}>
          📅 오늘 남은 횟수 <strong>{remaining}/{LIMIT}</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* 입력 방식 탭 */}
        <div style={card}>
          <div style={{ display: 'flex', gap: '6px', background: '#f5f3ff', borderRadius: '12px', padding: '4px', marginBottom: '16px' }}>
            {(['text', 'file'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setInputType(t)} style={{
                flex: 1, padding: '8px', borderRadius: '9px', border: 'none',
                fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                background: inputType === t ? '#fff' : 'transparent',
                color: inputType === t ? '#6d28d9' : '#a78bfa',
                boxShadow: inputType === t ? '0 1px 6px rgba(109,40,217,0.12)' : 'none',
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
                  width: '100%', height: '148px', padding: '13px',
                  background: '#fafafa', border: '1.5px solid #ede9fe',
                  borderRadius: '12px', fontSize: '14px', resize: 'none', outline: 'none',
                  lineHeight: 1.6, color: '#3b2d6e',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = '#ede9fe'}
              />
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#c4b5fd', marginTop: '5px' }}>
                {text.length.toLocaleString()} / 10,000
              </div>
            </>
          ) : (
            <>
              <div onClick={() => fileRef.current?.click()} style={{
                border: `2px dashed ${file ? '#6ee7b7' : '#c4b5fd'}`,
                borderRadius: '14px', padding: '32px 20px', cursor: 'pointer',
                background: file ? '#f0fdf4' : '#fafafa',
                textAlign: 'center', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { if (!file) e.currentTarget.style.borderColor = '#7c3aed' }}
                onMouseLeave={e => { if (!file) e.currentTarget.style.borderColor = '#c4b5fd' }}
              >
                {file ? (
                  <>
                    <div style={{ fontSize: '24px' }}>✅</div>
                    <div style={{ fontWeight: 700, color: '#059669', marginTop: '6px', fontSize: '14px' }}>{file.name}</div>
                    <div style={{ fontSize: '11px', color: '#6ee7b7', marginTop: '2px' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '28px' }}>🌸</div>
                    <div style={{ fontWeight: 700, color: '#7c3aed', marginTop: '8px', fontSize: '14px' }}>클릭하여 파일 선택</div>
                    <div style={{ fontSize: '12px', color: '#a78bfa', marginTop: '4px' }}>JPG · PNG · WEBP · PDF · TXT (10MB 이하)</div>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.txt" style={{ display: 'none' }} onChange={handleFileChange} />
              {fileError && <p style={{ fontSize: '13px', color: '#ef4444', margin: '8px 0 0' }}>{fileError}</p>}
            </>
          )}
        </div>

        {/* 난이도 */}
        <div style={card}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: '14px', color: '#6d28d9' }}>난이도 선택</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {DIFFICULTY_OPTIONS.map((opt) => {
              const active = difficulty === opt.value
              return (
                <button key={opt.value} type="button" onClick={() => setDifficulty(opt.value)} style={{
                  padding: '14px 6px', borderRadius: '13px', cursor: 'pointer',
                  border: `2px solid ${active ? opt.activeColor + '40' : '#ede9fe'}`,
                  background: active ? opt.activeBg : '#fafafa',
                  fontWeight: 700, fontSize: '13px',
                  color: active ? opt.activeColor : '#a78bfa',
                  boxShadow: active ? `0 4px 12px ${opt.activeColor}1a` : 'none',
                  transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                }}>
                  <span>{opt.label}</span>
                  <span style={{ fontSize: '10px', fontWeight: 500, opacity: 0.8 }}>{opt.desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 문항 수 */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#6d28d9' }}>문항 수</p>
            <span style={{ fontSize: '32px', fontWeight: 900, color: '#7c3aed', letterSpacing: '-1.5px', lineHeight: 1 }}>
              {count}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#c4b5fd' }}>문항</span>
          </div>
          <input type="range" min={1} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))}
            style={{ width: '100%' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#c4b5fd', marginTop: '5px' }}>
            <span>1</span><span>10</span><span>20</span>
          </div>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1.5px solid #fecaca',
            borderRadius: '12px', padding: '11px 16px', fontSize: '13px', color: '#b91c1c', textAlign: 'center',
          }}>{error}</div>
        )}

        <button type="submit" disabled={loading || remaining === 0} style={{
          width: '100%', padding: '17px',
          background: loading || remaining === 0
            ? '#f3f4f6'
            : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          color: loading || remaining === 0 ? '#9ca3af' : '#fff',
          border: 'none',
          borderRadius: '14px', fontWeight: 800, fontSize: '15px',
          cursor: loading || remaining === 0 ? 'not-allowed' : 'pointer',
          letterSpacing: '-0.3px',
          boxShadow: loading || remaining === 0 ? 'none' : '0 6px 20px rgba(124,58,237,0.35)',
          transition: 'all 0.2s',
        }}>
          {loading ? '⏳ 문제 생성 중...' : '✨ 문제 생성하기'}
        </button>

        <p style={{ fontSize: '11px', color: '#c4b5fd', margin: 0, textAlign: 'center' }}>
          PDF 20페이지 이하 · 파일 10MB 이하 권장
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
