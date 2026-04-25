'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface PlaceFilterProps {
  locale: string
  activeCategory?: string
  activeCity?: string
  searchQuery?: string
}

const categories = [
  { key: 'food', emoji: '🍽', ko: '맛집', en: 'Food' },
  { key: 'cafe', emoji: '☕', ko: '카페', en: 'Cafe' },
  { key: 'spot', emoji: '📍', ko: '명소', en: 'Spots' },
  { key: 'shopping', emoji: '🛍', ko: '쇼핑', en: 'Shopping' },
  { key: 'activity', emoji: '🎯', ko: '액티비티', en: 'Activity' },
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

export default function PlaceFilter({
  locale,
  activeCategory,
  activeCity,
  searchQuery,
}: PlaceFilterProps) {
  const router = useRouter()
  const isKo = locale === 'ko'
  const [query, setQuery] = useState(searchQuery ?? '')

  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams()
    if (key !== 'category' && activeCategory) params.set('category', activeCategory)
    if (key !== 'city' && activeCity) params.set('city', activeCity)
    if (key !== 'q' && searchQuery) params.set('q', searchQuery)
    if (value) params.set(key, value)
    params.delete('page')
    router.push(`/${locale}/places?${params.toString()}`)
  }

  const handleSearch = () => {
    updateFilter('q', query || undefined)
  }

  const handleReset = () => {
    setQuery('')
    router.push(`/${locale}/places`)
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-4">
      {/* 검색바 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={isKo ? '장소명 검색...' : 'Search places...'}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-sky-400 transition-colors"
        />
        <button
          onClick={handleSearch}
          className="bg-sky-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-sky-600 transition-colors"
        >
          {isKo ? '검색' : 'Search'}
        </button>
        {(activeCategory || activeCity || searchQuery) && (
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            {isKo ? '초기화' : 'Reset'}
          </button>
        )}
      </div>

      {/* 카테고리 필터 */}
      <div>
        <p className="text-xs text-gray-400 mb-2 font-medium">
          {isKo ? '카테고리' : 'Category'}
        </p>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() =>
                updateFilter('category', activeCategory === cat.key ? undefined : cat.key)
              }
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeCategory === cat.key
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300 hover:text-sky-600'
              }`}
            >
              {cat.emoji} {isKo ? cat.ko : cat.en}
            </button>
          ))}
        </div>
      </div>

      {/* 지역 필터 */}
      <div>
        <p className="text-xs text-gray-400 mb-2 font-medium">
          {isKo ? '지역' : 'Region'}
        </p>
        <div className="flex gap-2 flex-wrap">
          {cities.map((c) => (
            <button
              key={c.key}
              onClick={() =>
                updateFilter('city', activeCity === c.key ? undefined : c.key)
              }
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeCity === c.key
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300 hover:text-sky-600'
              }`}
            >
              {isKo ? c.ko : c.en}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
