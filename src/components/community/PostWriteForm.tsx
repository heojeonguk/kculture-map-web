'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface PostWriteFormProps {
  locale: string
}

const categories = ['free', 'food', 'spot', 'cafe', 'activity']

const cities: { key: string; regionKey: string }[] = [
  { key: '서울', regionKey: 'seoul' },
  { key: '부산', regionKey: 'busan' },
  { key: '제주', regionKey: 'jeju' },
  { key: '경기', regionKey: 'gyeonggi' },
  { key: '인천', regionKey: 'incheon' },
  { key: '강원', regionKey: 'gangwon' },
  { key: '경상', regionKey: 'gyeongSang' },
  { key: '전라', regionKey: 'jeolla' },
  { key: '충청', regionKey: 'chungcheong' },
]

export default function PostWriteForm({ locale }: PostWriteFormProps) {
  const t = useTranslations('community')
  const tCategory = useTranslations('category')
  const tAi = useTranslations('ai')
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('free')
  const [city, setCity] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push(`/${locale}/auth/login`)
        return
      }
      setUser(data.user)
      setLoading(false)
    })
  }, [locale, router])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const addTag = () => {
    let raw = tagInput.trim().replace(/^#/, '')
    raw = raw.replace(/[^a-zA-Z0-9가-힣_]/g, '').slice(0, 20)
    if (!raw || tags.length >= 5 || tags.includes(raw)) { setTagInput(''); return }
    setTags(prev => [...prev, raw])
    setTagInput('')
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); addTag() }
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async () => {
    if (!title.trim()) { setError(t('errorTitle')); return }
    if (!content.trim()) { setError(t('errorContent')); return }

    setSubmitting(true)
    setError('')

    const supabase = createClient()
    let photoUrl: string | null = null

    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const fileName = `${user.id}_${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('community-photos')
        .upload(fileName, photoFile)

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('community-photos').getPublicUrl(fileName)
        photoUrl = urlData.publicUrl
      }
    }

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        title: title.trim(),
        content: content.trim(),
        category,
        city: city || null,
        photo_url: photoUrl,
        user_id: user.id,
        user_name: user.user_metadata?.nickname ?? user.email?.split('@')[0] ?? t('anonymous'),
        likes: 0,
        tags: tags.length > 0 ? tags : null,
      })
      .select('id')
      .single()

    if (postError) {
      setError(t('errorSave'))
      setSubmitting(false)
      return
    }

    router.push(`/${locale}/community/${post.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/${locale}/community`}
        className="text-sm text-gray-400 hover:text-sky-500 transition-colors flex items-center gap-1 w-fit"
      >
        ← {t('title')}
      </Link>

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h1 className="text-lg font-bold text-gray-800 mb-5">
          ✏️ {t('writePost')}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* 카테고리 */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-600 mb-2 block">
            {t('category')}
          </label>
          <div className="flex gap-2 flex-wrap">
            {categories.map((key) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  category === key
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300'
                }`}
              >
                {tCategory(key)}
              </button>
            ))}
          </div>
        </div>

        {/* 지역 */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-600 mb-2 block">
            {t('regionOptional')}
          </label>
          <div className="flex gap-2 flex-wrap">
            {cities.map((c) => (
              <button
                key={c.key}
                onClick={() => setCity(city === c.key ? '' : c.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  city === c.key
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300'
                }`}
              >
                {tAi(`regions.${c.regionKey}`)}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            {t('titleLabel')} *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
            maxLength={100}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-sky-400 transition-colors"
          />
          <p className="text-[10px] text-gray-400 text-right mt-1">{title.length}/100</p>
        </div>

        {/* 본문 */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            {t('contentLabel')} *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('contentPlaceholder')}
            rows={8}
            maxLength={2000}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-sky-400 transition-colors resize-none"
          />
          <p className="text-[10px] text-gray-400 text-right mt-1">{content.length}/2000</p>
        </div>

        {/* 태그 */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            {t('tagsLabel')}
          </label>
          {tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-2">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
                  #{tag}
                  <button onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="text-blue-400 hover:text-blue-600 ml-0.5">×</button>
                </span>
              ))}
            </div>
          )}
          {tags.length < 5 && (
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={t('tagPlaceholder')}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-sky-400 transition-colors"
              />
              <button
                onClick={addTag}
                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200 transition-colors"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* 사진 업로드 */}
        <div className="mb-6">
          <label className="text-xs font-medium text-gray-600 mb-2 block">
            {t('photoOptional')}
          </label>

          {photoPreview ? (
            <div className="relative w-full max-h-64 rounded-xl overflow-hidden">
              <img src={photoPreview} alt="preview" className="w-full max-h-64 object-cover rounded-xl" />
              <button
                onClick={handleRemovePhoto}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-black/70 transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-sky-300 hover:text-sky-400 transition-colors"
            >
              <span className="text-2xl">📷</span>
              <span className="text-xs">{t('addPhoto')}</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <Link
            href={`/${locale}/community`}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 text-center hover:bg-gray-50 transition-colors"
          >
            {t('cancel')}
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 bg-sky-500 text-white rounded-xl text-sm font-medium hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? t('saving') : t('post')}
          </button>
        </div>
      </div>
    </div>
  )
}
