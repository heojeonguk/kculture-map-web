'use client'

import Link from 'next/link'

interface BookmarkedPlace {
  place_id: string
  places: {
    id: string
    name: string
    name_en?: string
    category?: string
    city?: string
    emoji?: string
  } | null
}

interface MyBookmarksProps {
  bookmarks: BookmarkedPlace[]
  locale: string
}

export default function MyBookmarks({ bookmarks, locale }: MyBookmarksProps) {
  const isKo = locale === 'ko'
  const places = bookmarks.map(b => b.places).filter(Boolean) as NonNullable<BookmarkedPlace['places']>[]

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <h2 className="text-base font-bold text-gray-800 mb-4">
        🔖 {isKo ? `가고싶은 장소 ${places.length}곳` : `Saved Places (${places.length})`}
      </h2>

      {places.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <span className="text-4xl mb-3">📭</span>
          <p className="text-sm">{isKo ? '저장한 장소가 없습니다' : 'No saved places yet'}</p>
          <Link
            href={`/${locale}/places`}
            className="mt-3 text-xs text-sky-500 hover:text-sky-600"
          >
            {isKo ? '장소 둘러보기 →' : 'Explore places →'}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {places.map(place => (
            <Link
              key={place.id}
              href={`/${locale}/places/${place.id}`}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
            >
              <span className="text-xl shrink-0">{place.emoji ?? '📍'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {isKo ? place.name : (place.name_en ?? place.name)}
                </p>
                <p className="text-xs text-gray-400">{place.category} · {place.city}</p>
              </div>
              <span className="text-xs text-sky-500 shrink-0">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
