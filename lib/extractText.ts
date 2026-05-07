// 파일에서 텍스트를 추출하는 유틸리티 (클라이언트 사이드)

const MAX_TEXT_LENGTH = 10000

export function truncate(text: string): string {
  return text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) : text
}

export async function extractFromFile(file: File): Promise<string> {
  if (file.type === 'text/plain') {
    const text = await file.text()
    return truncate(text)
  }

  if (file.type.startsWith('image/')) {
    // 이미지는 base64로 변환해서 API로 전달 (텍스트 추출은 서버에서)
    return await fileToBase64(file)
  }

  if (file.type === 'application/pdf') {
    // PDF는 base64로 변환해서 API로 전달
    return await fileToBase64(file)
  }

  throw new Error('지원하지 않는 파일 형식입니다.')
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // data:image/jpeg;base64,... 형태에서 base64 부분만 추출
      const base64 = result.split(',')[1]
      resolve(base64 ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const FILE_LIMITS = {
  image: {
    maxSize: 10 * 1024 * 1024, // 10MB
    types: ['image/jpeg', 'image/png', 'image/webp'],
    label: '이미지 (JPG·PNG·WEBP, 10MB 이하)',
  },
  pdf: {
    maxSize: 10 * 1024 * 1024, // 10MB
    types: ['application/pdf'],
    label: 'PDF (10MB 이하, 20페이지 이하)',
  },
  text: {
    maxSize: 1 * 1024 * 1024, // 1MB
    types: ['text/plain'],
    label: '텍스트 파일 (TXT)',
  },
}

export function validateFile(file: File): string | null {
  const allTypes = [
    ...FILE_LIMITS.image.types,
    ...FILE_LIMITS.pdf.types,
    ...FILE_LIMITS.text.types,
  ]

  if (!allTypes.includes(file.type)) {
    return 'JPG, PNG, WEBP, PDF, TXT 파일만 업로드할 수 있습니다.'
  }

  const limit =
    FILE_LIMITS.image.types.includes(file.type)
      ? FILE_LIMITS.image
      : FILE_LIMITS.pdf.types.includes(file.type)
        ? FILE_LIMITS.pdf
        : FILE_LIMITS.text

  if (file.size > limit.maxSize) {
    return `파일 크기는 10MB 이하여야 합니다. (현재: ${(file.size / 1024 / 1024).toFixed(1)}MB)`
  }

  return null
}
