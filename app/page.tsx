'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/store/quizStore'
import { validateFile } from '@/lib/extractText'
import { hasRemaining, getRemainingCount, incrementCount, LIMIT } from '@/lib/rateLimit'
import { T } from '@/lib/i18n'
import type { Difficulty, QuizQuestion } from '@/types'

const DIFFICULTY_OPTIONS: { value: Difficulty; color: string; bg: string; border: string }[] = [
  { value: 'easy',   color: '#0a7fa0', bg: 'rgba(129,202,214,0.15)', border: 'rgba(129,202,214,0.6)' },
  { value: 'normal', color: '#9a8500', bg: 'rgba(237,205,68,0.18)',  border: 'rgba(237,205,68,0.65)' },
  { value: 'hard',   color: '#b02f1e', bg: 'rgba(220,62,38,0.14)',   border: 'rgba(220,62,38,0.55)' },
]

const card: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid rgba(220,62,38,0.08)',
  boxShadow: '0 4px 20px rgba(220,62,38,0.10), 0 1px 4px rgba(0,0,0,0.06)',
  borderRadius: '22px',
  padding: '22px',
}

export default function HomePage() {
  const router = useRouter()
  const { setSession, uiLang, quizLangMode, setQuizLangMode } = useQuizStore()
  const t = T[uiLang]
  const fileRef = useRef<HTMLInputElement>(null)

  const [inputType, setInputType] = useState<'text' | 'file'>('text')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [count, setCount] = useState(3)
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
          body = { text: sourceText, difficulty, count, quizLangMode, uiLang }
        } else {
          fileBase64 = await toBase64(file); fileType = file.type
          body = { fileBase64, fileType, difficulty, count, quizLangMode, uiLang }
        }
      } else {
        sourceText = text.slice(0, 10000)
        body = { text: sourceText, difficulty, count, quizLangMode, uiLang }
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* 히어로 */}
      <div style={{
        background: 'linear-gradient(135deg, #DC3E26 0%, #e8762a 50%, #EDCD44 100%)',
        borderRadius: '22px',
        padding: '28px 24px',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(220,62,38,0.25)',
      }}>
        <h1 style={{ margin: '0 0 10px', lineHeight: 1.2 }}>
          <span style={{
            display: 'block',
            fontSize: '20px', fontWeight: 900,
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '-0.3px',
            marginBottom: '2px',
          }}>
            {t.heroTitle}
          </span>
          <span style={{
            display: 'block',
            fontSize: '34px', fontWeight: 900,
            color: '#fff',
            letterSpacing: '-1px',
            textShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}>
            {t.heroTitleAccent}
          </span>
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.88)', margin: '0 0 14px', fontWeight: 500 }}>
          {t.heroDesc}
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'rgba(255,255,255,0.25)',
          border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: '100px', padding: '5px 14px',
          fontSize: '12px', fontWeight: 700, color: '#fff',
        }}>
          📝 {t.remainingLabel} <strong style={{ color: '#fff' }}>{remaining}/{LIMIT}</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* 문제 언어 모드 */}
        <div style={card}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: '14px', color: '#DC3E26' }}>{t.quizLangTitle}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {(['source', 'translate'] as const).map((mode) => {
              const active = quizLangMode === mode
              const label = mode === 'source' ? t.quizLangSource : t.quizLangTranslate
              const desc = mode === 'source' ? t.quizLangSourceDesc : t.quizLangTranslateDesc
              return (
                <button key={mode} type="button" onClick={() => setQuizLangMode(mode)} style={{
                  padding: '14px 10px', borderRadius: '13px', cursor: 'pointer',
                  border: 'none',
                  background: active ? 'linear-gradient(135deg, #DC3E26, #EDCD44)' : 'rgba(220,62,38,0.06)',
                  fontWeight: 700, fontSize: '13px',
                  color: active ? '#fff' : '#aaa',
                  boxShadow: active ? '0 4px 14px rgba(220,62,38,0.3)' : 'none',
                  transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  textAlign: 'center',
                }}>
                  <span>{label}</span>
                  <span style={{ fontSize: '10px', fontWeight: 500, opacity: 0.8, lineHeight: 1.4, whiteSpace: 'pre-line' }}>{desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 입력 방식 탭 */}
        <div style={card}>
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(220,62,38,0.06)', borderRadius: '12px', padding: '4px', marginBottom: '16px' }}>
            {(['text', 'file'] as const).map((tp) => (
              <button key={tp} type="button" onClick={() => setInputType(tp)} style={{
                flex: 1, padding: '9px', borderRadius: '9px', border: 'none',
                fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                background: inputType === tp ? 'linear-gradient(135deg, #DC3E26, #EDCD44)' : 'transparent',
                color: inputType === tp ? '#fff' : '#999',
                boxShadow: inputType === tp ? '0 2px 10px rgba(220,62,38,0.35)' : 'none',
                transition: 'all 0.2s',
              }}>
                {tp === 'text' ? t.tabText : t.tabFile}
              </button>
            ))}
          </div>

          {inputType === 'text' ? (
            <>
              <textarea value={text} onChange={(e) => setText(e.target.value)}
                placeholder={t.textPlaceholder}
                maxLength={10000}
                style={{
                  width: '100%', height: '148px', padding: '13px',
                  background: '#f0f8fc', border: '1.5px solid #b8e0e8',
                  borderRadius: '12px', fontSize: '14px', resize: 'none', outline: 'none',
                  lineHeight: 1.6, color: '#0d2233', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#DC3E26'}
                onBlur={e => e.target.style.borderColor = '#b8e0e8'}
              />
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#81CAD6', marginTop: '5px' }}>
                {text.length.toLocaleString()} / 10,000
              </div>
            </>
          ) : (
            <>
              <div onClick={() => fileRef.current?.click()} style={{
                border: `2px dashed ${file ? '#6ee7b7' : '#81CAD6'}`,
                borderRadius: '14px', padding: '32px 20px', cursor: 'pointer',
                background: file ? '#f0fdf4' : '#f0f8fc',
                textAlign: 'center', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { if (!file) e.currentTarget.style.borderColor = '#0a7fa0' }}
                onMouseLeave={e => { if (!file) e.currentTarget.style.borderColor = '#81CAD6' }}
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
                    <div style={{ fontWeight: 700, color: '#0a7fa0', marginTop: '8px', fontSize: '14px' }}>{t.fileClickHint}</div>
                    <div style={{ fontSize: '12px', color: '#81CAD6', marginTop: '4px' }}>{t.fileTypeHint}</div>
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
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: '14px', color: '#DC3E26' }}>{t.difficultyTitle}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {DIFFICULTY_OPTIONS.map((opt) => {
              const active = difficulty === opt.value
              const label = opt.value === 'easy' ? t.diffEasy : opt.value === 'normal' ? t.diffNormal : t.diffHard
              const desc = opt.value === 'easy' ? t.diffEasyDesc : opt.value === 'normal' ? t.diffNormalDesc : t.diffHardDesc
              return (
                <button key={opt.value} type="button" onClick={() => setDifficulty(opt.value)} style={{
                  padding: '14px 6px', borderRadius: '13px', cursor: 'pointer',
                  border: `2px solid ${active ? opt.border : 'transparent'}`,
                  background: active ? opt.bg : 'rgba(240,248,252,0.85)',
                  fontWeight: 700, fontSize: '13px',
                  color: active ? opt.color : '#bbb',
                  boxShadow: active ? `0 4px 14px ${opt.border.replace('0.5)', '0.25)')}` : 'none',
                  transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                }}>
                  <span>{label}</span>
                  <span style={{ fontSize: '10px', fontWeight: 500, opacity: 0.8 }}>{desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 문항 수 */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#DC3E26' }}>{t.questionCountTitle}</p>
            <span style={{
              fontSize: '34px', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1,
              background: 'linear-gradient(135deg, #DC3E26, #EDCD44)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {count}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#81CAD6' }}>{t.questionCountUnit}</span>
          </div>
          <input type="range" min={1} max={5} value={count} onChange={(e) => setCount(Number(e.target.value))}
            style={{ width: '100%' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#81CAD6', marginTop: '5px' }}>
            <span>1</span><span>3</span><span>5</span>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255,255,255,0.9)', border: '1.5px solid #fca5a5',
            borderRadius: '12px', padding: '11px 16px', fontSize: '13px', color: '#b91c1c', textAlign: 'center',
          }}>{error}</div>
        )}

        <button type="submit" disabled={loading || remaining === 0} style={{
          width: '100%', padding: '18px',
          background: loading || remaining === 0
            ? 'rgba(255,255,255,0.25)'
            : 'linear-gradient(135deg, #DC3E26 0%, #EDCD44 100%)',
          color: loading || remaining === 0 ? 'rgba(255,255,255,0.5)' : '#fff',
          border: 'none',
          borderRadius: '16px', fontWeight: 900, fontSize: '16px',
          cursor: loading || remaining === 0 ? 'not-allowed' : 'pointer',
          letterSpacing: '-0.3px',
          boxShadow: loading || remaining === 0 ? 'none' : '0 8px 24px rgba(220,62,38,0.45)',
          transition: 'all 0.2s',
          textShadow: '0 1px 4px rgba(0,0,0,0.15)',
        }}>
          {loading ? t.generatingBtn : t.generateBtn}
        </button>

        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: 0, textAlign: 'center' }}>
          {t.fileHint}
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
