import Link from 'next/link'
import Image from 'next/image'

type Category = 'food' | 'cafe' | 'spot' | 'shopping' | 'activity'

interface Place {
  id: string
  name: string
  category: Category
  city: string
  district?: string
  photo_url?: string
  emoji?: string
}

interface PlaceGridProps {
  places: Place[]
  locale: string
}

const categoryConfig: Record<Category, { emoji: string; ko: string; en: string; bg: string }> = {
  food: { emoji: '🍽', ko: '맛집', en: 'Food', bg: 'bg-orange-50' },
  cafe: { emoji: '☕', ko: '카페', en: 'Cafe', bg: 'bg-amber-50' },
  spot: { emoji: '📍', ko: '명소', en: 'Spot', bg: 'bg-green-50' },
  shopping: { emoji: '🛍', ko: '쇼핑', en: 'Shop', bg: 'bg-pink-50' },
  activity: { emoji: '🎯', ko: '액티비티', en: 'Activity', bg: 'bg-blue-50' },
}

export default function PlaceGrid({ places, locale }: PlaceGridProps) {
  const isKo = locale === 'ko'

  if (!places || places.length === 0) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-800">
          🔥 {isKo ? '인기 장소' : 'Popular Places'}
        </h2>
        <Link
          href={`/${locale}/places`}
          className="text-xs text-gray-400 hover:text-sky-600 transition-colors"
        >
          {isKo ? '더보기 →' : 'View all →'}
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {places.map((place) => {
          const config = categoryConfig[place.category] ?? categoryConfig.spot
          return (
            <Link
              key={place.id}
              href={`/${locale}/places/${place.id}`}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-sky-300 hover:shadow-md transition-all"
            >
              {/* 이미지 영역 */}
              <div className={`h-24 ${config.bg} flex items-center justify-center relative`}>
                {place.photo_url ? (
                  <Image
                    src={`/api/place-photo?ref=${place.photo_url}`}
                    alt={place.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-3xl">{place.emoji ?? config.emoji}</span>
                )}
              </div>

              {/* 정보 영역 */}
              <div className="p-2.5">
                <p className="text-xs font-semibold text-gray-800 truncate">{place.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded-full">
                    {isKo ? config.ko : config.en}
                  </span>
                  <span className="text-[10px] text-gray-400">{place.city}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
