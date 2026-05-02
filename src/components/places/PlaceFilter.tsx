'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface PlaceFilterProps {
  locale: string
  activeCategory?: string
  activeCity?: string
  searchQuery?: string
}

type Category = 'food' | 'cafe' | 'spot' | 'shopping' | 'activity'

const categories: { key: Category; emoji: string }[] = [
  { key: 'food', emoji: '🍽' },
  { key: 'cafe', emoji: '☕' },
  { key: 'spot', emoji: '📍' },
  { key: 'shopping', emoji: '🛍' },
  { key: 'activity', emoji: '🎯' },
]

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

export default function PlaceFilter({
  locale,
  activeCategory,
  activeCity,
  searchQuery,
}: PlaceFilterProps) {
  const t = useTranslations('places')
  const tCategory = useTranslations('category')
  const tAi = useTranslations('ai')
  const router = useRouter()
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
          placeholder={t('searchPlaceholder')}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-sky-400 transition-colors"
        />
        <button
          onClick={handleSearch}
          className="bg-sky-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-sky-600 transition-colors"
        >
          {t('searchButton')}
        </button>
        {(activeCategory || activeCity || searchQuery) && (
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            {t('reset')}
          </button>
        )}
      </div>

      {/* 카테고리 필터 */}
      <div>
        <p className="text-xs text-gray-400 mb-2 font-medium">{t('category')}</p>
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
              {cat.emoji} {tCategory(cat.key)}
            </button>
          ))}
        </div>
      </div>

      {/* 지역 필터 */}
      <div>
        <p className="text-xs text-gray-400 mb-2 font-medium">{t('region')}</p>
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
              {tAi(`regions.${c.regionKey}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
