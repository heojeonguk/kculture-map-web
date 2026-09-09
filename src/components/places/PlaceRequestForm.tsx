'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  REQUEST_CATEGORIES,
  REQUEST_CITIES,
  MAX_PHOTOS,
  MAX_PHOTO_BYTES,
  ALLOWED_PHOTO_TYPES,
  ALLOWED_PHOTO_EXTS,
  MAX_DESCRIPTION_LENGTH,
} from '@/lib/placeRequest'

interface PlaceRequestFormProps {
  locale: string
}

interface PhotoItem {
  file: File
  preview: string
}

const emptyForm = {
  name: '',
  name_en: '',
  category: '',
  city: '',
  address: '',
  phone: '',
  hours: '',
  website: '',
  description: '',
  requester_email: '',
  requester_name: '',
}

export default function PlaceRequestForm({ locale }: PlaceRequestFormProps) {
  const t = useTranslations('placeRequest')
  const tCategory = useTranslations('category')
  const tAi = useTranslations('ai')
  const { user } = useCurrentUser()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState(emptyForm)
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // 로그인 상태면 이메일을 기본값으로 채운다 (사용자가 고칠 수 있음)
  useEffect(() => {
    if (user?.email) {
      setForm((prev) => (prev.requester_email ? prev : { ...prev, requester_email: user.email! }))
    }
  }, [user])

  // 미리보기 objectURL 정리
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.preview))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setField = (key: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setError('')

    const accepted: PhotoItem[] = []
    for (const file of files) {
      if (photos.length + accepted.length >= MAX_PHOTOS) {
        setError(t('errorTooManyPhotos', { max: MAX_PHOTOS }))
        break
      }
      if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
        setError(t('errorPhotoType'))
        continue
      }
      if (file.size > MAX_PHOTO_BYTES) {
        setError(t('errorPhotoSize', { max: 5 }))
        continue
      }
      accepted.push({ file, preview: URL.createObjectURL(file) })
    }

    if (accepted.length > 0) setPhotos((prev) => [...prev, ...accepted])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const target = prev[index]
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const resetForm = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.preview))
    setPhotos([])
    setForm({ ...emptyForm, requester_email: user?.email ?? '' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async () => {
    if (submitting) return

    if (!form.name.trim()) return setError(t('errorName'))
    if (!form.category) return setError(t('errorCategory'))
    if (!form.city) return setError(t('errorCity'))
    if (!form.address.trim()) return setError(t('errorAddress'))
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.requester_email.trim())) {
      return setError(t('errorEmail'))
    }

    setSubmitting(true)
    setError('')

    try {
      // 1) 사진을 Storage에 업로드
      const photoUrls: string[] = []
      if (photos.length > 0) {
        const supabase = createClient()
        const uuid = crypto.randomUUID()

        for (let i = 0; i < photos.length; i++) {
          const { file } = photos[i]
          const rawExt = file.name.split('.').pop()?.toLowerCase() ?? ''
          const ext = ALLOWED_PHOTO_EXTS.includes(rawExt) ? rawExt : 'jpg'
          const filePath = `place-request/${uuid}-${i}.${ext}`

          const { error: uploadError } = await supabase.storage
            .from('community-photos')
            .upload(filePath, file, { contentType: file.type })

          if (uploadError) {
            setError(t('errorUpload'))
            setSubmitting(false)
            return
          }

          const { data: urlData } = supabase.storage
            .from('community-photos')
            .getPublicUrl(filePath)
          photoUrls.push(urlData.publicUrl)
        }
      }

      // 2) 요청 생성 (user_id는 서버가 세션에서 채운다)
      const res = await fetch(`${window.location.origin}/api/place-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          name_en: form.name_en.trim() || null,
          category: form.category,
          city: form.city,
          address: form.address.trim(),
          phone: form.phone.trim() || null,
          hours: form.hours.trim() || null,
          website: form.website.trim() || null,
          description: form.description.trim() || null,
          photo_urls: photoUrls.length > 0 ? photoUrls : null,
          requester_email: form.requester_email.trim(),
          requester_name: form.requester_name.trim() || null,
        }),
      })

      if (!res.ok) {
        setError(t('errorSubmit'))
        setSubmitting(false)
        return
      }

      setSuccess(true)
      resetForm()
    } catch {
      setError(t('errorSubmit'))
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-sky-400 transition-colors'
  const labelClass = 'text-xs font-medium text-gray-600 mb-1.5 block'

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/${locale}/places`}
        className="text-sm text-gray-400 hover:text-sky-500 transition-colors flex items-center gap-1 w-fit"
      >
        ← {t('backToPlaces')}
      </Link>

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h1 className="text-lg font-bold text-gray-800 mb-1">📮 {t('title')}</h1>
        <p className="text-xs text-gray-400 mb-5">{t('subtitle')}</p>

        {success && (
          <div className="bg-sky-50 border border-sky-100 text-sky-700 text-sm rounded-xl px-4 py-3 mb-4">
            ✅ {t('successMessage')}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* 장소명 */}
        <div className="mb-4">
          <label className={labelClass}>{t('name')} *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder={t('namePlaceholder')}
            maxLength={120}
            className={inputClass}
          />
        </div>

        {/* 영문명 */}
        <div className="mb-4">
          <label className={labelClass}>{t('nameEn')}</label>
          <input
            type="text"
            value={form.name_en}
            onChange={(e) => setField('name_en', e.target.value)}
            placeholder={t('nameEnPlaceholder')}
            maxLength={120}
            className={inputClass}
          />
        </div>

        {/* 카테고리 */}
        <div className="mb-4">
          <label className={labelClass}>{t('category')} *</label>
          <select
            value={form.category}
            onChange={(e) => setField('category', e.target.value)}
            className={inputClass}
          >
            <option value="">{t('selectCategory')}</option>
            {REQUEST_CATEGORIES.map((key) => (
              <option key={key} value={key}>
                {tCategory(key)}
              </option>
            ))}
          </select>
        </div>

        {/* 지역 */}
        <div className="mb-4">
          <label className={labelClass}>{t('city')} *</label>
          <select
            value={form.city}
            onChange={(e) => setField('city', e.target.value)}
            className={inputClass}
          >
            <option value="">{t('selectCity')}</option>
            {REQUEST_CITIES.map((c) => (
              <option key={c.key} value={c.key}>
                {tAi(`regions.${c.regionKey}`)}
              </option>
            ))}
          </select>
        </div>

        {/* 주소 */}
        <div className="mb-4">
          <label className={labelClass}>{t('address')} *</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setField('address', e.target.value)}
            placeholder={t('addressPlaceholder')}
            maxLength={300}
            className={inputClass}
          />
        </div>

        {/* 전화번호 */}
        <div className="mb-4">
          <label className={labelClass}>{t('phone')}</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
            placeholder={t('phonePlaceholder')}
            maxLength={40}
            className={inputClass}
          />
        </div>

        {/* 영업시간 */}
        <div className="mb-4">
          <label className={labelClass}>{t('hours')}</label>
          <input
            type="text"
            value={form.hours}
            onChange={(e) => setField('hours', e.target.value)}
            placeholder={t('hoursPlaceholder')}
            maxLength={200}
            className={inputClass}
          />
        </div>

        {/* 웹사이트 */}
        <div className="mb-4">
          <label className={labelClass}>{t('website')}</label>
          <input
            type="url"
            value={form.website}
            onChange={(e) => setField('website', e.target.value)}
            placeholder="https://example.com"
            maxLength={500}
            className={inputClass}
          />
        </div>

        {/* 소개 */}
        <div className="mb-4">
          <label className={labelClass}>{t('description')}</label>
          <textarea
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder={t('descriptionPlaceholder')}
            rows={5}
            maxLength={MAX_DESCRIPTION_LENGTH}
            className={`${inputClass} resize-none`}
          />
          <p className="text-[10px] text-gray-400 text-right mt-1">
            {form.description.length}/{MAX_DESCRIPTION_LENGTH}
          </p>
        </div>

        {/* 사진 업로드 */}
        <div className="mb-4">
          <label className={labelClass}>
            {t('photos')} ({photos.length}/{MAX_PHOTOS})
          </label>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-2">
              {photos.map((p, i) => (
                <div key={p.preview} className="relative aspect-square rounded-xl overflow-hidden">
                  <img src={p.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-sky-300 hover:text-sky-400 transition-colors"
            >
              <span className="text-2xl">📷</span>
              <span className="text-xs">{t('addPhoto')}</span>
            </button>
          )}

          <p className="text-[10px] text-gray-400 mt-1">{t('photoHint')}</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        <hr className="border-gray-100 my-5" />

        {/* 이메일 */}
        <div className="mb-4">
          <label className={labelClass}>{t('email')} *</label>
          <input
            type="email"
            value={form.requester_email}
            onChange={(e) => setField('requester_email', e.target.value)}
            placeholder={t('emailPlaceholder')}
            maxLength={254}
            className={inputClass}
          />
        </div>

        {/* 이름 */}
        <div className="mb-6">
          <label className={labelClass}>{t('requesterName')}</label>
          <input
            type="text"
            value={form.requester_name}
            onChange={(e) => setField('requester_name', e.target.value)}
            placeholder={t('requesterNamePlaceholder')}
            maxLength={80}
            className={inputClass}
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-sky-500 text-white rounded-xl text-sm font-medium hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting && (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          {submitting ? t('submitting') : t('submit')}
        </button>
      </div>
    </div>
  )
}
