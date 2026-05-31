import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  AlertCircle,
  FileText,
  Home,
  ImageIcon,
  Loader2,
  Settings,
  Upload,
  WandSparkles,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { generateBlogPost, type BlogPost } from '@/lib/gemini'

type UploadedImage = {
  id: string
  file: File
  previewUrl: string
}

type RouteKey = 'home' | 'archive' | 'settings'

const routes: Array<{
  key: RouteKey
  label: string
  href: string
  icon: typeof Home
}> = [
  { key: 'home', label: '작성', href: '#/', icon: Home },
  { key: 'archive', label: '보관함', href: '#/archive', icon: FileText },
  { key: 'settings', label: '설정', href: '#/settings', icon: Settings },
]

function getRouteFromHash(): RouteKey {
  const hash = window.location.hash.replace('#', '')

  if (hash === '/archive') {
    return 'archive'
  }

  if (hash === '/settings') {
    return 'settings'
  }

  return 'home'
}

function App() {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [topic, setTopic] = useState('')
  const [targetLength, setTargetLength] = useState(1600)
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null)
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeRoute, setActiveRoute] = useState<RouteKey>(() => getRouteFromHash())
  const imagesRef = useRef<UploadedImage[]>([])

  const canGenerate = images.length > 0 && topic.trim().length > 0 && !isGenerating

  const imageLabel = useMemo(() => {
    if (images.length === 0) {
      return '이미지 선택'
    }

    return `${images.length}장 선택됨`
  }, [images.length])

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl))
    }
  }, [])

  useEffect(() => {
    function handleHashChange() {
      setActiveRoute(getRouteFromHash())
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  function handleImagesChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith('image/'),
    )

    const nextImages = selectedFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    setImages((currentImages) => [...currentImages, ...nextImages])
    event.target.value = ''
  }

  function removeImage(id: string) {
    setImages((currentImages) => {
      const imageToRemove = currentImages.find((image) => image.id === id)

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl)
      }

      return currentImages.filter((image) => image.id !== id)
    })
  }

  function updateTargetLength(value: number) {
    if (!Number.isFinite(value)) {
      return
    }

    const roundedValue = Math.round(value / 100) * 100
    const clampedValue = Math.min(Math.max(roundedValue, 600), 4000)

    setTargetLength(clampedValue)
  }

  async function handleGenerate() {
    if (!canGenerate) {
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const generatedPost = await generateBlogPost({
        topic: topic.trim(),
        images: images.map((image) => image.file),
        targetLength,
      })

      setBlogPost(generatedPost)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : '콘텐츠 생성 중 오류가 발생했습니다.'

      setError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="clay-shell min-h-screen text-slate-950">
      <header className="sticky top-0 z-20 border-b border-white/55 bg-[#f7ebe1]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <a className="flex items-center gap-3" href="#/">
            <span className="clay-mark flex size-11 items-center justify-center rounded-2xl text-white">
              <WandSparkles className="size-5" aria-hidden="true" />
            </span>
            <span className="grid">
              <span className="text-base font-bold tracking-normal">Blog Clay</span>
              <span className="text-xs font-medium text-slate-500">이미지 기반 초안 작성</span>
            </span>
          </a>

          <nav className="clay-nav flex items-center gap-1 rounded-2xl p-1">
            {routes.map((route) => {
              const Icon = route.icon
              const isActive = activeRoute === route.key

              return (
                <a
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition',
                    isActive
                      ? 'bg-white text-slate-950 shadow-[inset_0_-2px_4px_rgba(255,255,255,0.75),0_8px_18px_rgba(124,81,50,0.14)]'
                      : 'text-slate-500 hover:bg-white/50 hover:text-slate-900',
                  ].join(' ')}
                  href={route.href}
                  key={route.key}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{route.label}</span>
                </a>
              )
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
        {activeRoute === 'home' ? (
          <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
            <section className="clay-panel flex flex-col gap-5 rounded-[2rem] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">입력</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal">
                블로그 콘텐츠 생성
              </h1>
            </div>
            <div className="clay-mark flex size-11 items-center justify-center rounded-2xl text-white">
              <WandSparkles className="size-5" aria-hidden="true" />
            </div>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="images">이미지</Label>
            <label
              className="clay-dropzone flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.5rem] px-4 text-center transition hover:scale-[1.01]"
              htmlFor="images"
            >
              <Upload className="size-7 text-[#ea7a5f]" aria-hidden="true" />
              <span className="text-sm font-medium">{imageLabel}</span>
              <span className="text-xs text-slate-500">PNG, JPG, WEBP</span>
            </label>
            <Input
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              id="images"
              multiple
              onChange={handleImagesChange}
              type="file"
            />
          </div>

          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {images.map((image) => (
                <div
                  className="clay-tile group relative aspect-square overflow-hidden rounded-2xl"
                  key={image.id}
                >
                  <img
                    alt={image.file.name}
                    className="size-full object-cover"
                    src={image.previewUrl}
                  />
                  <Button
                    aria-label={`${image.file.name} 삭제`}
                    className="absolute right-1.5 top-1.5 size-7 opacity-0 group-hover:opacity-100"
                    onClick={() => removeImage(image.id)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid gap-3">
            <Label htmlFor="topic">주제</Label>
            <textarea
              className="clay-field min-h-28 resize-none rounded-2xl px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-white/70"
              id="topic"
              onChange={(event) => setTopic(event.target.value)}
              placeholder="예: 제주도 감성 카페 투어 후기"
              value={topic}
            />
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="target-length">전체 글 길이</Label>
              <div className="flex items-center gap-2">
                  <Input
                  className="clay-field h-8 w-24 rounded-xl text-right"
                  id="target-length"
                  max={4000}
                  min={600}
                  onChange={(event) => updateTargetLength(Number(event.target.value))}
                  step={100}
                  type="number"
                  value={targetLength}
                />
                <span className="text-sm text-zinc-500">자</span>
              </div>
            </div>
            <input
              aria-label="전체 글 길이"
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/70 accent-[#ea7a5f]"
              max={4000}
              min={600}
              onChange={(event) => updateTargetLength(Number(event.target.value))}
              step={100}
              type="range"
              value={targetLength}
            />
            <p className="text-xs leading-5 text-slate-500">
              요약, 이미지별 본문, 맺는 말이 전체 길이에 맞춰 함께 조정됩니다.
            </p>
          </div>

          {error ? (
            <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          ) : null}

          <Button
            className="mt-auto"
            disabled={!canGenerate}
            onClick={handleGenerate}
            type="button"
          >
            {isGenerating ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <WandSparkles className="size-4" aria-hidden="true" />
            )}
            생성하기
          </Button>
            </section>

            <section className="clay-panel min-h-[calc(100vh-7.5rem)] rounded-[2rem]">
          <div className="flex items-center justify-between border-b border-white/60 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-slate-500">출력</p>
              <h2 className="mt-1 text-xl font-semibold tracking-normal">
                블로그 콘텐츠 출력
              </h2>
            </div>
            <FileText className="size-5 text-slate-500" aria-hidden="true" />
          </div>

          <div className="px-5 py-6">
            {isGenerating ? (
              <div className="flex min-h-[520px] flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="size-8 animate-spin text-slate-500" aria-hidden="true" />
                <p className="text-sm font-medium text-slate-600">
                  이미지를 읽고 블로그 글을 생성 중입니다.
                </p>
              </div>
            ) : blogPost ? (
              <article className="mx-auto max-w-3xl">
                <header className="mb-9">
                  <p className="text-sm font-medium text-zinc-500">{topic}</p>
                  <h3 className="mt-3 text-4xl font-semibold leading-tight tracking-normal">
                    {blogPost.title}
                  </h3>
                  <p className="mt-5 text-lg font-medium leading-8 text-slate-700">
                    {blogPost.summary}
                  </p>
                </header>

                <div className="grid gap-11">
                  {images.map((image, index) => {
                    const section =
                      blogPost.sections.find(
                        (postSection) => postSection.imageIndex === index,
                      ) ?? blogPost.sections[index]

                    return (
                      <section className="grid gap-4" key={image.id}>
                        <img
                          alt={image.file.name}
                          className="clay-tile mx-auto aspect-[16/9] w-full max-w-[80%] rounded-3xl object-cover max-sm:max-w-full"
                          src={image.previewUrl}
                        />
                        {section ? (
                          <div className="grid gap-3">
                            <h4 className="text-xl font-semibold leading-8 tracking-normal text-slate-900">
                              {section.heading}
                            </h4>
                            <p className="whitespace-pre-line text-base leading-8 text-slate-700">
                              {section.body}
                            </p>
                          </div>
                        ) : null}
                      </section>
                    )
                  })}
                </div>

                <footer className="mt-11 border-t border-white/70 pt-6">
                  <h4 className="text-2xl font-semibold tracking-normal">
                    마무리
                  </h4>
                  <p className="mt-3 text-base leading-8 text-slate-700">
                    {blogPost.conclusion}
                  </p>
                </footer>
              </article>
            ) : (
              <div className="clay-empty flex min-h-[520px] flex-col items-center justify-center gap-3 rounded-[1.75rem] text-center">
                <ImageIcon className="size-9 text-slate-400" aria-hidden="true" />
                <p className="text-sm font-medium text-slate-600">
                  이미지와 주제를 넣으면 블로그 글이 여기에 표시됩니다.
                </p>
              </div>
            )}
          </div>
            </section>
          </div>
        ) : (
          <section className="clay-panel flex min-h-[calc(100vh-7.5rem)] items-center justify-center rounded-[2rem] px-6 text-center">
            <div className="grid max-w-sm gap-3">
              <div className="clay-mark mx-auto flex size-14 items-center justify-center rounded-2xl text-white">
                {activeRoute === 'archive' ? (
                  <FileText className="size-6" aria-hidden="true" />
                ) : (
                  <Settings className="size-6" aria-hidden="true" />
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-normal">
                {activeRoute === 'archive' ? '보관함' : '설정'}
              </h1>
              <p className="text-sm leading-6 text-slate-500">
                화면 구조만 준비했습니다. 세부 기능은 아직 연결하지 않았습니다.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

export default App
