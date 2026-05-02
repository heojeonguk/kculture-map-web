'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

interface PostFilterProps {
  locale: string
  activeCategory?: string
  activeSort: string
}

const tabs = ['all', 'free', 'food', 'spot', 'cafe', 'activity']
const sorts = ['latest', 'best']

export default function PostFilter({ locale, activeCategory, activeSort }: PostFilterProps) {
  const t = useTranslations('community')
  const tCategory = useTranslations('category')
  const router = useRouter()
  const currentCategory = activeCategory ?? 'all'
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    if (currentCategory !== 'all') params.set('category', currentCategory)
    params.set('sort', activeSort)
    router.push(`/${locale}/community?${params.toString()}`)
  }

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams()
    if (key !== 'category') params.set('category', currentCategory)
    if (key !== 'sort') params.set('sort', activeSort)
    params.set(key, value)
    params.delete('page')
    router.push(`/${locale}/community?${params.toString()}`)
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
      {/* 상단: 카테고리 탭 + 글쓰기 버튼 */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5 flex-wrap flex-1">
          {tabs.map((key) => (
            <button
              key={key}
              onClick={() => updateFilter('category', key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                currentCategory === key
                  ? 'bg-sky-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {key === 'all' ? t('all') : tCategory(key)}
            </button>
          ))}
        </div>

        <Link
          href={`/${locale}/community/write`}
          className="shrink-0 flex items-center gap-1.5 bg-sky-500 text-white px-3.5 py-1.5 rounded-full text-xs font-medium hover:bg-sky-600 transition-colors"
        >
          ✏️ {t('write')}
        </Link>
      </div>

      {/* 검색바 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={t('searchPlaceholder')}
          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-sky-400 transition-colors"
        />
        <button
          onClick={handleSearch}
          className="px-3 py-1.5 bg-sky-500 text-white rounded-xl text-xs font-medium hover:bg-sky-600 transition-colors"
        >
          {t('searchButton')}
        </button>
      </div>

      {/* 정렬 */}
      <div className="flex gap-1.5">
        {sorts.map((key) => (
          <button
            key={key}
            onClick={() => updateFilter('sort', key)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeSort === key
                ? 'bg-sky-100 text-sky-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {key === 'latest' ? t('latest') : t('popular')}
          </button>
        ))}
      </div>
    </div>
  )
}
