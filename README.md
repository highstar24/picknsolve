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

## 기능

- 텍스트 직접 입력 또는 파일 업로드 (이미지·PDF·TXT)
- 난이도 3단계 (쉬움 / 보통 / 어려움)
- 문항 수 1~20개 선택
- 5지 선다형 문제 자동 생성
- 즉시 정오답 확인 + AI 해설
- 오답 시 유사 문제 재도전 또는 패스
- 일일 생성 횟수 제한 (5회, localStorage 기반)

## 배포 (Vercel)

```bash
npm install -g vercel
vercel
```

Vercel 대시보드에서 환경 변수 `GEMINI_API_KEY` 추가 필수.
