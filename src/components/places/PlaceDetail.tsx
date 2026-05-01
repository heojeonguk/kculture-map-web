'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Category = 'food' | 'cafe' | 'spot' | 'shopping' | 'activity'

interface Place {
  id: string
  name: string
  name_en?: string
  name_zh?: string
  name_ja?: string
  category: Category
  city: string
  district?: string
  neighborhood?: string
  photo_url?: string
  emoji?: string
  rating?: number
  address?: string
  hours?: string
  price_range?: string
  is_open?: boolean
  lat?: number
  lng?: number
}

interface PlaceDetailProps {
  place: Place
  locale: string
}

const categoryConfig: Record<Category, { ko: string; en: string; bg: string; color: string }> = {
  food: { ko: '맛집', en: 'Food', bg: 'bg-orange-50', color: 'text-orange-600' },
  cafe: { ko: '카페', en: 'Cafe', bg: 'bg-amber-50', color: 'text-amber-600' },
  spot: { ko: '명소', en: 'Spot', bg: 'bg-blue-50', color: 'text-blue-600' },
  shopping: { ko: '쇼핑', en: 'Shop', bg: 'bg-pink-50', color: 'text-pink-600' },
  activity: { ko: '액티비티', en: 'Activity', bg: 'bg-sky-50', color: 'text-sky-600' },
}

function getLocalName(place: Place, locale: string): string {
  if (locale === 'zh-CN' || locale === 'zh-TW') return place.name_zh ?? place.name
  if (locale === 'ja') return place.name_ja ?? place.name
  if (locale !== 'ko') return place.name_en ?? place.name
  return place.name
}

export default function PlaceDetail({ place, locale }: PlaceDetailProps) {
  const isKo = locale === 'ko'
  const router = useRouter()
  const config = categoryConfig[place.category] ?? categoryConfig.spot
  const displayName = getLocalName(place, locale)

  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('place_bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('place_id', place.id)
        .single()
      if (data) setBookmarked(true)
    }
    init()
  }, [place.id])

  const handleBookmark = async () => {
    if (!userId) {
      alert(isKo ? '로그인이 필요합니다.' : 'Please log in first.')
      router.push(`/${locale}/auth/login`)
      return
    }
    if (bookmarkLoading) return
    setBookmarkLoading(true)
    const supabase = createClient()
    if (bookmarked) {
      await supabase.from('place_bookmarks').delete().eq('user_id', userId).eq('place_id', place.id)
      setBookmarked(false)
    } else {
      await supabase.from('place_bookmarks').insert({ user_id: userId, place_id: place.id })
      setBookmarked(true)
    }
    setBookmarkLoading(false)
  }

  const googleMapsUrl = place.lat && place.lng
    ? `https://www.google.com/maps?q=${place.lat},${place.lng}`
    : `https://www.google.com/maps/search/${encodeURIComponent(place.name + ' ' + (place.address ?? ''))}`

  return (
    <div className="flex flex-col gap-4">
      {/* 뒤로가기 */}
      <Link
        href={`/${locale}/places`}
        className="text-sm text-gray-400 hover:text-sky-500 transition-colors flex items-center gap-1 w-fit"
      >
        ← {isKo ? '장소 목록' : 'Back to places'}
      </Link>

      {/* 이미지 헤더 */}
      <div className={`relative w-full h-72 rounded-2xl overflow-hidden ${config.bg} flex items-center justify-center`}>
        {place.photo_url ? (
          <img
            src={place.photo_url ? `/api/place-photo?ref=${place.photo_url}` : undefined}
            alt={displayName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <span className="text-8xl">{place.emoji ?? '📍'}</span>
        )}
        {/* 카테고리 배지 */}
        <div className="absolute top-4 left-4">
          <span className={`bg-white/90 backdrop-blur-sm text-xs font-semibold px-3 py-1.5 rounded-full border ${config.color}`}>
            {isKo ? config.ko : config.en}
          </span>
        </div>
        {/* 영업 상태 */}
        {place.is_open !== undefined && (
          <div className="absolute top-4 right-4">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
              place.is_open
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-600'
            }`}>
              {place.is_open
                ? (isKo ? '영업중' : 'Open')
                : (isKo ? '영업종료' : 'Closed')}
            </span>
          </div>
        )}
      </div>

      {/* 기본 정보 */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            {place.name !== displayName && (
              <p className="text-sm text-gray-400 mt-0.5">{place.name}</p>
            )}
          </div>
          {place.rating && (
            <div className="flex flex-col items-center bg-amber-50 rounded-xl px-4 py-2 shrink-0">
              <span className="text-2xl font-bold text-amber-500">{place.rating.toFixed(1)}</span>
              <span className="text-xs text-amber-400">⭐⭐⭐⭐⭐</span>
            </div>
          )}
        </div>

        {/* 상세 정보 */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-start gap-3">
            <span className="text-base w-5 shrink-0 mt-0.5">📍</span>
            <div>
              <p className="text-sm text-gray-700">
                {place.city}
                {place.district && ` · ${place.district}`}
                {place.neighborhood && ` · ${place.neighborhood}`}
              </p>
              {place.address && (
                <p className="text-xs text-gray-400 mt-0.5">{place.address}</p>
              )}
            </div>
          </div>
          {place.hours && (
            <div className="flex items-start gap-3">
              <span className="text-base w-5 shrink-0 mt-0.5">🕐</span>
              <p className="text-sm text-gray-700">{place.hours}</p>
            </div>
          )}
          {place.price_range && (
            <div className="flex items-start gap-3">
              <span className="text-base w-5 shrink-0 mt-0.5">💰</span>
              <p className="text-sm text-gray-700">{place.price_range}</p>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2 mt-5">
          <button
            onClick={handleBookmark}
            disabled={bookmarkLoading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              bookmarked
                ? 'bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {bookmarked ? '✅' : '🔖'} {bookmarked ? (isKo ? '저장됨' : 'Saved') : (isKo ? '가고싶어요' : 'Save')}
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              alert(isKo ? '링크가 복사됐습니다!' : 'Link copied!')
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 transition-all"
          >
            🔗 {isKo ? '공유' : 'Share'}
          </button>
        </div>

        {/* 지도 버튼 */}
        <div className="flex gap-2 mt-3">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-sky-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-sky-600 transition-colors"
          >
            🗺 {isKo ? 'Google 지도로 보기' : 'View on Google Maps'}
          </a>
          <a
            href={`https://map.naver.com/v5/search/${encodeURIComponent(place.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
          >
            🗺 {isKo ? '네이버 지도로 보기' : 'View on Naver Map'}
          </a>
        </div>
      </div>
    </div>
  )
}
