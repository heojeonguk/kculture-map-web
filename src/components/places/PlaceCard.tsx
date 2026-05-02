'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

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

const categoryConfig: Record<Category, { bg: string }> = {
  food: { bg: 'bg-orange-50' },
  cafe: { bg: 'bg-amber-50' },
  spot: { bg: 'bg-blue-50' },
  shopping: { bg: 'bg-pink-50' },
  activity: { bg: 'bg-sky-50' },
}

export default function PlaceCard({ place, locale }: PlaceCardProps) {
  const t = useTranslations('category')
  const config = categoryConfig[place.category] ?? categoryConfig.spot

  return (
    <Link
      href={`/${locale}/places/${place.id}`}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-sky-300 hover:shadow-md transition-all group"
    >
      {/* 이미지 */}
      <div className={`h-40 ${config.bg} flex items-center justify-center relative overflow-hidden`}>
        {place.photo_url ? (
          <img
            src={`/api/place-photo?ref=${place.photo_url}`}
            alt={place.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
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
            {t(place.category)}
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
