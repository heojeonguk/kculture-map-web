'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SearchZoneProps {
  locale: string
}

type Category = 'food' | 'cafe' | 'spot' | 'shopping' | 'activity'

const categories: { key: Category; emoji: string; ko: string; en: string }[] = [
  { key: 'food', emoji: '🍽', ko: '맛집', en: 'Food' },
  { key: 'cafe', emoji: '☕', ko: '카페', en: 'Cafe' },
  { key: 'spot', emoji: '📍', ko: '명소', en: 'Spots' },
  { key: 'shopping', emoji: '🛍', ko: '쇼핑', en: 'Shopping' },
  { key: 'activity', emoji: '🎯', ko: '액티비티', en: 'Activity' },
]

export default function SearchZone({ locale }: SearchZoneProps) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const router = useRouter()
  const isKo = locale === 'ko'

  const handleSearch = () => {
    if (!query.trim() && !activeCategory) return
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (activeCategory) params.set('category', activeCategory)
    router.push(`/${locale}/search?${params.toString()}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <section className="bg-white border border-sky-200 rounded-2xl p-6">
      <h1 className="text-xl font-bold mb-1 text-gray-800">
        {isKo ? '한국 여행의 모든 것' : 'Discover Korea'}
      </h1>
      <p className="text-gray-500 text-sm mb-4">
        {isKo
          ? '맛집, 명소, 카페, 쇼핑, 액티비티를 한 곳에서'
          : "Korea's ultimate culture travel guide for global travelers"}
      </p>

      {/* 검색바 */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isKo ? '장소, 음식, 지역 검색...' : 'Search places, food, city...'}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 outline-none border border-gray-200 focus:ring-2 focus:ring-sky-200"
        />
        <button
          onClick={handleSearch}
          className="bg-sky-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-sky-600 transition-colors"
        >
          {isKo ? '검색' : 'Search'}
        </button>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() =>
              setActiveCategory(activeCategory === cat.key ? null : cat.key)
            }
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeCategory === cat.key
                ? 'bg-sky-500 text-white border-sky-500'
                : 'bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100'
            }`}
          >
            {cat.emoji} {isKo ? cat.ko : cat.en}
          </button>
        ))}
      </div>
    </section>
  )
}
