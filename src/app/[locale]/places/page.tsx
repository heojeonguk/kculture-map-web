import type { Metadata } from 'next'
import { Suspense } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { createPublicClient } from '@/lib/supabase/public'
import { BASE_URL, alternatesFor } from '@/lib/seo'
import { PLACES_PAGE_SIZE } from '@/lib/pagination'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Sidebar from '@/components/layout/Sidebar'
import PlaceFilter from '@/components/places/PlaceFilter'
import PlaceList from '@/components/places/PlaceList'
import PlacesBrowser from '@/components/places/PlacesBrowser'

// 1시간 ISR. searchParams를 서버에서 읽지 않으므로 쿼리 파라미터가 붙어도
// 같은 캐시 HTML로 응답되고, 필터/페이지네이션은 client에서 처리한다.
export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const title = locale === 'ko' ? 'K컬처MAP - 장소 탐색' : 'K컬처MAP - Explore Places'
  const description =
    locale === 'ko'
      ? '한국의 맛집, 카페, 명소, 쇼핑, 액티비티를 탐색하세요'
      : 'Explore restaurants, cafes, spots, shopping and activities in Korea'
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: alternatesFor(locale, '/places'),
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/places`,
      siteName: 'K컬처MAP',
      locale,
      type: 'website',
    },
  }
}

export default async function PlacesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = createPublicClient()

  // 필터 없는 1페이지만 서버에서 렌더해 ISR로 캐시한다.
  const { data: places, count } = await supabase
    .from('places')
    .select(
      'id, name, category, city, district, photo_url, emoji, rating, address',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(0, PLACES_PAGE_SIZE - 1)

  const totalPages = Math.ceil((count ?? 0) / PLACES_PAGE_SIZE)

  /*
   * PlacesBrowser는 useSearchParams를 쓰므로 프리렌더 시 Suspense fallback으로
   * 대체된다. fallback에 서버에서 조회한 1페이지를 그대로 넣어, 정적 HTML에
   * 실제 장소 목록과 상세 페이지 링크가 담기도록 한다(SEO + 크롤링 경로 확보).
   * 하이드레이션 후에는 PlacesBrowser가 같은 데이터로 이어받는다.
   */
  const defaultView = (
    <>
      <PlaceFilter locale={locale} />
      <PlaceList
        places={places ?? []}
        locale={locale}
        currentPage={1}
        totalPages={totalPages}
        totalCount={count ?? 0}
      />
    </>
  )

  return (
    <>
      <Header locale={locale} />
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr_160px] gap-6">
          <Sidebar position="left" className="hidden md:block" />

          <div className="flex flex-col gap-5 min-w-0">
            <Suspense fallback={defaultView}>
              <PlacesBrowser
                locale={locale}
                initialPlaces={places ?? []}
                initialCount={count ?? 0}
              />
            </Suspense>
          </div>

          <Sidebar position="right" className="hidden md:block" />
        </div>
      </main>
      <Footer locale={locale} />
    </>
  )
}
