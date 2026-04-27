'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const categories = [
  { key: 'free', ko: '자유', en: 'Free' },
  { key: 'food', ko: '맛집', en: 'Food' },
  { key: 'spot', ko: '명소', en: 'Spot' },
  { key: 'cafe', ko: '카페', en: 'Cafe' },
  { key: 'activity', ko: '액티비티', en: 'Activity' },
]

const cities = [
  { key: '서울', ko: '서울', en: 'Seoul' },
  { key: '부산', ko: '부산', en: 'Busan' },
  { key: '제주', ko: '제주', en: 'Jeju' },
  { key: '경기', ko: '경기', en: 'Gyeonggi' },
  { key: '인천', ko: '인천', en: 'Incheon' },
  { key: '강원', ko: '강원', en: 'Gangwon' },
  { key: '경상', ko: '경상', en: 'Gyeongsang' },
  { key: '전라', ko: '전라', en: 'Jeolla' },
  { key: '충청', ko: '충청', en: 'Chungcheong' },
]

export default function EditPostPage() {
  const params = useParams()
  const locale = params.locale as string
  const postId = params.postId as string
  const router = useRouter()
  const isKo = locale === 'ko'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('free')
  const [city, setCity] = useState('')
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace(`/${locale}/auth/login`); return }

      const { data: post } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single()

      if (!post) { router.replace(`/${locale}/community`); return }
      if (post.user_id !== user.id) { router.replace(`/${locale}/community`); return }

      setUserId(user.id)
      setTitle(post.title ?? '')
      setContent(post.content ?? '')
      setCategory(post.category ?? 'free')
      setCity(post.city ?? '')
      setExistingPhotoUrl(post.photo_url ?? null)
      setPhotoPreview(post.photo_url ?? null)
      setLoading(false)
    }
    init()
  }, [postId, locale])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setExistingPhotoUrl(null)
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    setExistingPhotoUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async () => {
    if (!title.trim()) { setError(isKo ? '제목을 입력해주세요' : 'Please enter a title'); return }
    if (!content.trim()) { setError(isKo ? '내용을 입력해주세요' : 'Please enter content'); return }

    setSubmitting(true)
    setError('')

    const supabase = createClient()
    let photoUrl: string | null = existingPhotoUrl

    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const fileName = `${userId}_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('community-photos')
        .upload(fileName, photoFile)
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('community-photos')
          .getPublicUrl(fileName)
        photoUrl = urlData.publicUrl
      }
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        title: title.trim(),
        content: content.trim(),
        category,
        city: city || null,
        photo_url: photoUrl,
      })
      .eq('id', postId)

    if (updateError) {
      setError(isKo ? '수정에 실패했습니다' : 'Failed to update post')
      setSubmitting(false)
      return
    }

    router.push(`/${locale}/community/${postId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto px-4 py-6">
      <Link
        href={`/${locale}/community/${postId}`}
        className="text-sm text-gray-400 hover:text-sky-500 transition-colors flex items-center gap-1 w-fit"
      >
        ← {isKo ? '게시글로 돌아가기' : 'Back to post'}
      </Link>

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h1 className="text-lg font-bold text-gray-800 mb-5">
          ✏️ {isKo ? '게시글 수정' : 'Edit Post'}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* 카테고리 */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-600 mb-2 block">
            {isKo ? '카테고리' : 'Category'}
          </label>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  category === cat.key
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300'
                }`}
              >
                {isKo ? cat.ko : cat.en}
              </button>
            ))}
          </div>
        </div>

        {/* 지역 */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-600 mb-2 block">
            {isKo ? '지역 (선택)' : 'Region (optional)'}
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
                {isKo ? c.ko : c.en}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            {isKo ? '제목' : 'Title'} *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-sky-400 transition-colors"
          />
          <p className="text-[10px] text-gray-400 text-right mt-1">{title.length}/100</p>
        </div>

        {/* 본문 */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            {isKo ? '내용' : 'Content'} *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            maxLength={2000}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-sky-400 transition-colors resize-none"
          />
          <p className="text-[10px] text-gray-400 text-right mt-1">{content.length}/2000</p>
        </div>

        {/* 사진 */}
        <div className="mb-6">
          <label className="text-xs font-medium text-gray-600 mb-2 block">
            {isKo ? '사진 (선택)' : 'Photo (optional)'}
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
              <span className="text-xs">{isKo ? '사진 추가' : 'Add photo'}</span>
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
            href={`/${locale}/community/${postId}`}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 text-center hover:bg-gray-50 transition-colors"
          >
            {isKo ? '취소' : 'Cancel'}
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 bg-sky-500 text-white rounded-xl text-sm font-medium hover:bg-sky-600 transition-colors disabled:opacity-50"
          >
            {submitting ? (isKo ? '저장 중...' : 'Saving...') : (isKo ? '수정 완료' : 'Save')}
          </button>
        </div>
      </div>
    </div>
  )
}
