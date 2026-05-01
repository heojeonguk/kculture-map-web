import Link from 'next/link'
import Image from 'next/image'

type Category = 'food' | 'cafe' | 'spot' | 'shopping' | 'activity'

export interface Place {
  id: string
  name: string
  category: Category
  city: string
  district?: string
  photo_url?: string
  emoji?: string
  rating?: number
  address?: string
}

interface PlaceCardProps {
  place: Place
  locale: string
}

const categoryConfig: Record<Category, { ko: string; en: string; bg: string }> = {
  food: { ko: '맛집', en: 'Food', bg: 'bg-orange-50' },
  cafe: { ko: '카페', en: 'Cafe', bg: 'bg-amber-50' },
  spot: { ko: '명소', en: 'Spot', bg: 'bg-blue-50' },
  shopping: { ko: '쇼핑', en: 'Shop', bg: 'bg-pink-50' },
  activity: { ko: '액티비티', en: 'Activity', bg: 'bg-sky-50' },
}

export default function PlaceCard({ place, locale }: PlaceCardProps) {
  const isKo = locale === 'ko'
  const config = categoryConfig[place.category] ?? categoryConfig.spot

  return (
    <Link
      href={`/${locale}/places/${place.id}`}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-sky-300 hover:shadow-md transition-all group"
    >
      {/* 이미지 */}
      <div className={`h-40 ${config.bg} flex items-center justify-center relative overflow-hidden`}>
        {place.photo_url ? (
          <Image
            src={place.photo_url ? `/api/place-photo?ref=${place.photo_url}` : undefined}
            alt={place.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-5xl">{place.emoji ?? '📍'}</span>
        )}
      </div>

      {/* 정보 */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-gray-800 truncate">{place.name}</p>
          {place.rating && (
            <span className="text-xs text-amber-500 font-medium shrink-0">
              ⭐ {place.rating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full border border-sky-100">
            {isKo ? config.ko : config.en}
          </span>
          <span className="text-[11px] text-gray-400">
            {place.city} {place.district && `· ${place.district}`}
          </span>
        </div>

        {place.address && (
          <p className="text-[11px] text-gray-400 mt-1.5 truncate">{place.address}</p>
        )}
      </div>
    </Link>
  )
}
