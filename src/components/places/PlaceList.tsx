import PlaceCard from './PlaceCard'
import Link from 'next/link'

interface Place {
  id: string
  name: string
  category: any
  city: string
  district?: string
  photo_url?: string
  emoji?: string
  rating?: number
  address?: string
}

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
  const isKo = locale === 'ko'

  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <span className="text-5xl mb-4">🔍</span>
        <p className="text-base font-medium">
          {isKo ? '검색 결과가 없습니다' : 'No places found'}
        </p>
        <p className="text-sm mt-1">
          {isKo ? '다른 조건으로 검색해보세요' : 'Try different filters'}
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* 결과 수 */}
      <p className="text-sm text-gray-500 mb-4">
        {isKo ? `총 ${totalCount}개의 장소` : `${totalCount} places found`}
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
              ← {isKo ? '이전' : 'Prev'}
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
              {isKo ? '다음' : 'Next'} →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
