export type BlogPost = {
  title: string
  summary: string
  sections: Array<{
    imageIndex: number
    heading: string
    body: string
  }>
  conclusion: string
}

type GenerateBlogPostInput = {
  topic: string
  images: File[]
  targetLength: number
}

type GeminiTextPart = {
  text: string
}

type GeminiImagePart = {
  inline_data: {
    mime_type: string
    data: string
  }
}

const MODEL = 'gemini-3.1-flash-lite'
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

export async function generateBlogPost({
  topic,
  images,
  targetLength,
}: GenerateBlogPostInput): Promise<BlogPost> {
  if (!API_KEY) {
    throw new Error('Gemini API 키가 없습니다. .env의 VITE_GEMINI_API_KEY를 확인하세요.')
  }

  const imageParts: GeminiImagePart[] = await Promise.all(
    images.map(async (image) => ({
      inline_data: {
        mime_type: image.type,
        data: await fileToBase64(image),
      },
    })),
  )

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [buildPrompt(topic, targetLength, images.length), ...imageParts],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.7,
        },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  )

  if (!response.ok) {
    throw new Error('모델명 또는 키 확인 필요')
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

  if (typeof text !== 'string') {
    throw new Error('Gemini 응답 형식이 올바르지 않습니다.')
  }

  return parseBlogPost(text)
}

function buildPrompt(
  topic: string,
  targetLength: number,
  imageCount: number,
): GeminiTextPart {
  return {
    text: [
      '업로드된 이미지들을 참고해서 한국어 블로그 글을 작성하세요.',
      `주제: ${topic}`,
      `목표 전체 글자수: 공백 포함 약 ${targetLength}자`,
      `업로드 이미지 수: ${imageCount}장`,
      '이미지는 새로 만들지 말고 관찰과 분위기를 글에 반영하세요.',
      '출력은 블로그처럼 제목, 핵심 내용 요약, 이미지별 본문 순서로 구성하세요.',
      '문체는 보고서나 기사처럼 딱딱하면 안 됩니다.',
      '첫 문장은 자연스러운 인사말로 시작하세요. 예: "안녕하세요, 오늘은..."',
      '독자가 실제로 방문하거나 경험하는 입장에서 공감할 수 있게 편안한 말투로 작성하세요.',
      '정보 전달이 충분해야 하므로 분위기만 쓰지 말고 볼거리, 이용 팁, 추천 포인트, 아쉬운 점도 자연스럽게 포함하세요.',
      '각 section은 업로드 이미지 1장에 대응되는 글입니다.',
      'section heading은 기사식 소제목이 아니라 블로그에서 자연스럽게 넘어가는 짧은 문장으로 작성하세요.',
      'heading에는 과장된 표현, 딱딱한 명사형 제목, 콜론, 번호, 따옴표를 쓰지 마세요.',
      '좋은 heading 예: "드디어 출발선에 섰어요", "이 구간은 생각보다 분위기가 좋았어요", "사진으로 다시 보니 더 생생하네요"',
      '반드시 JSON만 반환하세요.',
      '스키마: {"title":"string","summary":"string","sections":[{"imageIndex":0,"heading":"string","body":"string"}],"conclusion":"string"}',
      'sections는 업로드된 이미지 수만큼 작성하세요.',
      'imageIndex는 0부터 시작하는 이미지 순서입니다.',
      '목표 전체 글자수는 summary, 모든 section body, conclusion을 합친 길이 기준입니다. title과 heading은 제외합니다.',
      'summary만 고정 길이로 만들지 말고, summary, 각 section body, conclusion이 목표 글자수에 맞춰 함께 늘거나 줄게 작성하세요.',
      '분량 배분은 summary 약 15%, 전체 section body 약 70%, conclusion 약 15%로 하세요.',
      'section body의 총량은 이미지 수에 맞춰 균등하게 나누되, 이미지 내용이 많은 곳은 조금 더 길게 작성하세요.',
      '짧은 글자수에서는 각 문단을 간결하게, 긴 글자수에서는 방문 팁과 관찰 내용을 더 자세히 풀어주세요.',
      'conclusion은 단순 요약이 아니라 다시 방문하고 싶게 만드는 맺는 말로 작성하세요.',
    ].join('\n'),
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener('load', () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('이미지를 읽을 수 없습니다.'))
        return
      }

      resolve(reader.result.split(',')[1] ?? '')
    })

    reader.addEventListener('error', () => {
      reject(new Error('이미지를 읽는 중 오류가 발생했습니다.'))
    })

    reader.readAsDataURL(file)
  })
}

function parseBlogPost(text: string): BlogPost {
  const cleanedText = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  const parsed = JSON.parse(cleanedText) as Partial<BlogPost>

  if (
    typeof parsed.title !== 'string' ||
    typeof parsed.summary !== 'string' ||
    !Array.isArray(parsed.sections) ||
    typeof parsed.conclusion !== 'string'
  ) {
    throw new Error('생성된 글의 구조가 올바르지 않습니다.')
  }

  return {
    title: parsed.title,
    summary: parsed.summary,
    sections: parsed.sections
      .filter(
        (section) =>
          typeof section?.heading === 'string' &&
          typeof section?.body === 'string' &&
          typeof section?.imageIndex === 'number',
      )
      .map((section) => ({
        imageIndex: section.imageIndex,
        heading: section.heading,
        body: section.body,
      })),
    conclusion: parsed.conclusion,
  }
}
