'use client'

import { useEffect } from 'react'
import { useQuizStore } from '@/store/quizStore'
import { LANG_LABELS } from '@/lib/i18n'
import type { UiLang } from '@/lib/i18n'

const LANGS: UiLang[] = ['KR', 'EN', 'ZH']

export default function LangSelector() {
  const { uiLang, setUiLang } = useQuizStore()

  // 앱 로드 시 localStorage에서 언어 복원
  useEffect(() => {
    const saved = localStorage.getItem('uiLang') as UiLang | null
    if (saved && LANGS.includes(saved)) setUiLang(saved)
  }, [setUiLang])

  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {LANGS.map((lang) => (
        <button
          key={lang}
          onClick={() => setUiLang(lang)}
          style={{
            padding: '4px 10px',
            borderRadius: '100px',
            border: 'none',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s',
            background: uiLang === lang
              ? 'linear-gradient(135deg, #FF7F42, #FFAF24)'
              : 'rgba(255,255,255,0.15)',
            color: uiLang === lang ? '#fff' : 'rgba(255,255,255,0.6)',
            boxShadow: uiLang === lang ? '0 2px 8px rgba(255,127,66,0.4)' : 'none',
          }}
        >
          {LANG_LABELS[lang]}
        </button>
      ))}
    </div>
  )
}
