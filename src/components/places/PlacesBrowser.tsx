'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { PLACES_PAGE_SIZE } from '@/lib/pagination'
import PlaceFilter from './PlaceFilter'
import PlaceList from './PlaceList'
import type { Place } from './PlaceCard'

interface PlacesBrowserProps {
  locale: string
  /** 서버가 ISR로 미리 렌더한 "필터 없는 1페이지" 결과 */
  initialPlaces: Place[]
  initialCount: number
}

interface Result {
  key: string
  places: Place[]
  count: number
}

/**
 * 장소 목록 조회를 client로 옮긴 컴포넌트.
 *
 * 기본 화면(/places, 쿼리 없음)은 서버가 ISR로 만들어둔 결과를 그대로 쓰므로
 * 추가 요청이 없고, 봇이 긁는 URL도 전부 캐시에서 응답된다.
 * 필터·페이지네이션(?category=, ?page= 등)만 브라우저에서 조회하므로
 * 서버 CPU를 쓰지 않는다.
 */
export default function PlacesBrowser({
  locale,
  initialPlaces,
  initialCount,
}: PlacesBrowserProps) {
  const t = useTranslations('common')
  const searchParams = useSearchParams()

  const category = searchParams.get('category') ?? undefined
  const city = searchParams.get('city') ?? undefined
  const q = searchParams.get('q') ?? undefined
  const rawPage = Number(searchParams.get('page') ?? 1)
  const currentPage = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1

  const isDefaultView = !category && !city && !q && currentPage === 1
  const queryKey = JSON.stringify([category, city, q, currentPage])

  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    // 기본 화면은 서버가 준 결과를 쓰므로 조회하지 않는다.
    if (isDefaultView) return

    let cancelled = false
    const offset = (currentPage - 1) * PLACES_PAGE_SIZE
    const supabase = createClient()

    let query = supabase
      .from('places')
      .select(
        'id, name, category, city, district, photo_url, emoji, rating, address',
        { count: 'exact' }
      )

    if (category) query = query.eq('category', category)
    if (city) query = query.eq('city', city)
    if (q) query = query.ilike('name', `%${q}%`)

    query
      .order('created_at', { ascending: false })
      .range(offset, offset + PLACES_PAGE_SIZE - 1)
      .then(({ data, count }) => {
        if (cancelled) return
        setResult({ key: queryKey, places: (data ?? []) as Place[], count: count ?? 0 })
      })

    return () => {
      cancelled = true
    }
  }, [isDefaultView, queryKey, category, city, q, currentPage])

  // 표시할 데이터는 state 동기화 없이 파생시킨다.
  // (현재 쿼리와 키가 일치하는 결과가 없으면 로딩 중)
  const current = isDefaultView
    ? { places: initialPlaces, count: initialCount }
    : result?.key === queryKey
      ? result
      : null

  // 페이지네이션 링크가 현재 필터를 유지하도록 page 외 파라미터를 넘긴다.
  const filterParams = new URLSearchParams()
  if (category) filterParams.set('category', category)
  if (city) filterParams.set('city', city)
  if (q) filterParams.set('q', q)

  return (
    <>
      <PlaceFilter
        key={`${category ?? ''}|${city ?? ''}|${q ?? ''}`}
        locale={locale}
        activeCategory={category}
        activeCity={city}
        searchQuery={q}
      />
      {current ? (
        <PlaceList
          places={current.places}
          locale={locale}
          currentPage={currentPage}
          totalPages={Math.ceil(current.count / PLACES_PAGE_SIZE)}
          totalCount={current.count}
          filterQuery={filterParams.toString()}
        />
      ) : (
        <p className="py-20 text-center text-sm text-gray-400">{t('loading')}</p>
      )}
    </>
  )
}
