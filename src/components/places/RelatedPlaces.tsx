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
  rating?: number
}

interface RelatedPlacesProps {
  places: Place[]
  locale: string
  category: Category
}

const categoryConfig: Record<Category, { ko: string; en: string; bg: string }> = {
  food: { ko: '맛집', en: 'Food', bg: 'bg-orange-50' },
  cafe: { ko: '카페', en: 'Cafe', bg: 'bg-amber-50' },
  spot: { ko: '명소', en: 'Spot', bg: 'bg-blue-50' },
  shopping: { ko: '쇼핑', en: 'Shop', bg: 'bg-pink-50' },
  activity: { ko: '액티비티', en: 'Activity', bg: 'bg-sky-50' },
}

export default function RelatedPlaces({ places, locale, category }: RelatedPlacesProps) {
  const isKo = locale === 'ko'
  const config = categoryConfig[category] ?? categoryConfig.spot

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <h2 className="text-base font-bold text-gray-800 mb-4">
        {isKo ? `비슷한 ${config.ko}` : `Similar ${config.en}s`}
      </h2>
      <div className="grid grid-cols-4 gap-3">
        {places.map((place) => (
          <Link
            key={place.id}
            href={`/${locale}/places/${place.id}`}
            className="group"
          >
            <div className={`h-20 ${config.bg} rounded-xl flex items-center justify-center mb-2 overflow-hidden relative`}>
              {place.photo_url ? (
                <Image
                  src={place.photo_url ? `/api/place-photo?ref=${place.photo_url}` : undefined}
                  alt={place.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <span className="text-2xl">{place.emoji ?? '📍'}</span>
              )}
            </div>
            <p className="text-xs font-medium text-gray-700 truncate">{place.name}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {place.city}
              {place.rating && ` · ⭐${place.rating.toFixed(1)}`}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
