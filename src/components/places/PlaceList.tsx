'use client'

import { useTranslations } from 'next-intl'
import PlaceCard, { Place } from './PlaceCard'
import Link from 'next/link'

interface PlaceListProps {
  places: Place[]
  locale: string
  currentPage: number
  totalPages: number
  totalCount: number
}

export default function PlaceList({
  places,
  locale,
  currentPage,
  totalPages,
  totalCount,
}: PlaceListProps) {
  const t = useTranslations('places')

  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <span className="text-5xl mb-4">🔍</span>
        <p className="text-base font-medium">{t('noResults')}</p>
        <p className="text-sm mt-1">{t('noResultsSub')}</p>
      </div>
    )
  }

  return (
    <div>
      {/* 결과 수 */}
      <p className="text-sm text-gray-500 mb-4">
        {t('total', { count: totalCount })}
      </p>

      {/* 그리드 */}
      <div className="grid grid-cols-3 gap-4">
        {places.map((place) => (
          <PlaceCard key={place.id} place={place} locale={locale} />
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {currentPage > 1 && (
            <Link
              href={`/${locale}/places?page=${currentPage - 1}`}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-sky-300 hover:text-sky-600 transition-colors"
            >
              ← {t('prev')}
            </Link>
          )}

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => Math.abs(p - currentPage) <= 2)
            .map((p) => (
              <Link
                key={p}
                href={`/${locale}/places?page=${p}`}
                className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm border transition-colors ${
                  p === currentPage
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'border-gray-200 text-gray-600 hover:border-sky-300 hover:text-sky-600'
                }`}
              >
                {p}
              </Link>
            ))}

          {currentPage < totalPages && (
            <Link
              href={`/${locale}/places?page=${currentPage + 1}`}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-sky-300 hover:text-sky-600 transition-colors"
            >
              {t('next')} →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
