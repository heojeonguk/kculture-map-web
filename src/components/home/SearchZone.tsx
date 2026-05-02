'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

interface SearchZoneProps {
  locale: string
}

type Category = 'food' | 'cafe' | 'spot' | 'shopping' | 'activity'

const categories: { key: Category; emoji: string }[] = [
  { key: 'food', emoji: '🍽️' },
  { key: 'cafe', emoji: '☕' },
  { key: 'spot', emoji: '📍' },
  { key: 'shopping', emoji: '🛍️' },
  { key: 'activity', emoji: '🎯' },
]

interface Place {
  id: string
  name: string
  name_en?: string
  category?: string
  city?: string
  emoji?: string
  rating?: number
}

interface Post {
  id: string
  title: string
  category?: string
  city?: string
  user_name?: string
  likes?: number
}

export default function SearchZone({ locale }: SearchZoneProps) {
  const t = useTranslations()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [places, setPlaces] = useState<Place[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [searched, setSearched] = useState(false)
  const router = useRouter()

  const handleSearch = async () => {
    if (!query.trim() && !activeCategory) return

    const searchQuery = [query.trim(), activeCategory].filter(Boolean).join(' ')
    setLoading(true)
    setSearched(true)
    setAnswer(null)
    setPlaces([])
    setPosts([])

    try {
      const res = await fetch(`${window.location.origin}/api/ai-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, locale }),
      })
      const data = await res.json()
      setAnswer(data.answer)
      setPlaces(data.places || [])
      setPosts(data.posts || [])
    } catch {
      setAnswer(t('home.searchError'))
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleReset = () => {
    setQuery('')
    setActiveCategory(null)
    setSearched(false)
    setAnswer(null)
    setPlaces([])
    setPosts([])
  }

  return (
    <section className="bg-white border border-sky-200 rounded-2xl p-6">
      <h1 className="text-xl font-bold mb-1 text-gray-800">
        {t('home.title')}
      </h1>
      <p className="text-gray-500 text-sm mb-4">
        {t('home.subtitle')}
      </p>

      {/* 검색창 */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('home.searchPlaceholder')}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 outline-none border border-gray-200 focus:ring-2 focus:ring-sky-200"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-sky-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-sky-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : '✨'}
          {t('home.searchButton')}
        </button>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeCategory === cat.key
                ? 'bg-sky-500 text-white border-sky-500'
                : 'bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100'
            }`}
          >
            {cat.emoji} {t(`category.${cat.key}`)}
          </button>
        ))}
      </div>

      {/* AI 검색 결과 */}
      {searched && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              {t('home.aiSearching')}
            </div>
          ) : (
            <>
              {answer && (
                <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 mb-4 text-sm text-gray-700 leading-relaxed">
                  <p className="text-[10px] text-sky-400 font-medium mb-1">{t('home.aiLabel')}</p>
                  {answer}
                </div>
              )}

              {places.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">
                    📍 {t('home.recommendedPlaces')}
                  </p>
                  <div className="flex flex-col gap-2">
                    {places.map(place => (
                      <Link
                        key={place.id}
                        href={`/${locale}/places/${place.id}`}
                        className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-sky-200 hover:bg-sky-50 transition-all"
                      >
                        <span className="text-xl shrink-0">{place.emoji ?? '📍'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {locale === 'ko' ? place.name : (place.name_en ?? place.name)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {place.category} · {place.city}
                            {place.rating ? ` · ⭐ ${place.rating}` : ''}
                          </p>
                        </div>
                        <span className="text-xs text-sky-500 shrink-0">→</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {posts.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">
                    💬 {t('home.relatedPosts')}
                  </p>
                  <div className="flex flex-col gap-2">
                    {posts.map(post => (
                      <Link
                        key={post.id}
                        href={`/${locale}/community/${post.id}`}
                        className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-sky-200 hover:bg-sky-50 transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{post.title}</p>
                          <p className="text-xs text-gray-400">
                            {post.user_name} · 🔥 {post.likes ?? 0}
                          </p>
                        </div>
                        <span className="text-xs text-sky-500 shrink-0 ml-2">→</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {places.length === 0 && posts.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  {t('home.noSearchResults')}
                </p>
              )}

              <button
                onClick={handleReset}
                className="text-xs text-gray-400 hover:text-sky-500 transition-colors mt-2"
              >
                {t('home.clearSearch')}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  )
}
