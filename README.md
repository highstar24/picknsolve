# 픽앤솔브 (Pick & Solve)

AI 기반 맞춤형 퀴즈 생성 서비스

## 시작 전 준비

### 1. Gemini API 키 발급

1. [Google AI Studio](https://aistudio.google.com/apikey) 접속
2. "Create API key" 클릭
3. 발급된 키 복사

### 2. 환경 변수 설정

`.env.local` 파일에 API 키 입력:

```
GEMINI_API_KEY=여기에_발급받은_API_키_붙여넣기
```

### 3. 개발 서버 실행

```bash
cd C:\Projects\picknsolve
npm run dev
```

브라우저에서 http://localhost:3000 열기

---

## 기능

### 퀴즈 생성
- 텍스트 직접 입력 또는 파일 업로드 (JPG · PNG · WEBP · PDF · TXT)
- 난이도 3단계 (쉬움 / 보통 / 어려움)
- 문항 수 1~5개 선택
- 5지 선다형 문제 자동 생성
- 일일 생성 횟수 제한 (5회, localStorage 기반)

### 퀴즈 풀기
- 즉시 정오답 확인 + AI 해설
- 오답 시 유사 문제 재도전 (문제당 1회 제한) 또는 패스

### 문제 언어 모드
- **원어 그대로**: 자료 언어로 문제·보기·해설 출제
- **번역 학습**: 질문·해설은 UI 언어로, 보기는 자료 원어로 출제
  - 예) 중국어 자료 + KR 앱 → 질문은 한국어, 보기는 중국어

### 다국어 UI
- 헤더에서 언어 전환: **KR · EN · 中文**
- 선택 언어가 localStorage에 저장되어 유지됨

### 보안 / 안정성
- IP 기반 rate limiting (분당 10회 초과 시 차단)
- API 키는 서버 환경 변수에만 보관 (클라이언트 미노출)

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript (strict) |
| 상태 관리 | Zustand |
| AI 모델 | Google Gemini 2.5 Flash Lite |
| 배포 | Vercel |

---

## 프로젝트 구조

```
app/
├── page.tsx              # 홈 (퀴즈 생성 폼)
├── quiz/page.tsx         # 퀴즈 풀기
├── result/page.tsx       # 결과 화면
├── layout.tsx            # 공통 레이아웃 + 헤더
└── api/
    ├── generate/route.ts # 문제 생성 API
    └── similar/route.ts  # 유사 문제 생성 API
components/
└── LangSelector.tsx      # 언어 선택 버튼 (KR/EN/中文)
store/
└── quizStore.ts          # Zustand 전역 상태
lib/
├── i18n.ts               # KR/EN/ZH 번역 문자열
├── rateLimit.ts          # 일일 생성 횟수 제한 (localStorage)
└── extractText.ts        # 파일 유효성 검사
middleware.ts             # IP 기반 rate limiting
types/
└── index.ts              # 공통 타입 정의
```

---

## 배포 (Vercel)

```bash
git push origin main
```

Vercel과 GitHub 연동 시 push만으로 자동 배포됩니다.
Vercel 대시보드 → Settings → Environment Variables에서 `GEMINI_API_KEY` 추가 필수.

---

## API 한도 (Gemini 무료 티어)

| 항목 | 한도 |
|------|------|
| 일일 요청 (RPD) | 1,000회 |
| 분당 요청 (RPM) | 15회 |
| 1인당 최대 생성 | 5회/일 (앱 자체 제한) |
| 1인당 최대 문제 수 | 최대 50문제/일 (유사문제 포함) |
