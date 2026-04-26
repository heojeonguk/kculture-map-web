'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PostFilterProps {
  locale: string
  activeCategory?: string
  activeSort: string
}

const tabs = [
  { key: 'all', ko: '전체', en: 'All' },
  { key: 'free', ko: '자유', en: 'Free' },
  { key: 'food', ko: '맛집', en: 'Food' },
  { key: 'spot', ko: '명소', en: 'Spot' },
  { key: 'cafe', ko: '카페', en: 'Cafe' },
  { key: 'activity', ko: '액티비티', en: 'Activity' },
]

const sorts = [
  { key: 'latest', ko: '최신순', en: 'Latest' },
  { key: 'best', ko: '인기순', en: 'Popular' },
]

export default function PostFilter({ locale, activeCategory, activeSort }: PostFilterProps) {
  const router = useRouter()
  const isKo = locale === 'ko'
  const currentCategory = activeCategory ?? 'all'

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
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => updateFilter('category', tab.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                currentCategory === tab.key
                  ? 'bg-sky-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isKo ? tab.ko : tab.en}
            </button>
          ))}
        </div>

        {/* 글쓰기 버튼 */}
        <Link
          href={`/${locale}/community/write`}
          className="shrink-0 flex items-center gap-1.5 bg-sky-500 text-white px-3.5 py-1.5 rounded-full text-xs font-medium hover:bg-sky-600 transition-colors"
        >
          ✏️ {isKo ? '글쓰기' : 'Write'}
        </Link>
      </div>

      {/* 정렬 */}
      <div className="flex gap-1.5">
        {sorts.map((s) => (
          <button
            key={s.key}
            onClick={() => updateFilter('sort', s.key)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeSort === s.key
                ? 'bg-sky-100 text-sky-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {isKo ? s.ko : s.en}
          </button>
        ))}
      </div>
    </div>
  )
}
