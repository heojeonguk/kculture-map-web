import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createPublicClient } from '@/lib/supabase/public'
import { BASE_URL, alternatesFor } from '@/lib/seo'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import PlaceDetail from '@/components/places/PlaceDetail'
import RelatedPlaces from '@/components/places/RelatedPlaces'

// 24시간 ISR. 장소 데이터는 거의 바뀌지 않으므로 길게 잡는다.
export const revalidate = 86400

/**
 * 빌드 시에는 한 페이지도 만들지 않는다 (수만 페이지 생성 방지).
 * 다만 빈 배열이라도 선언해야 Next.js 16이 이 라우트를 ISR로 등록한다.
 * 선언이 없으면 revalidate가 무시되고 요청마다 서버 렌더링된다.
 * 실제 페이지는 첫 요청 때 생성되어 이후 revalidate 기간 동안 캐시된다.
 */
export function generateStaticParams(): { locale: string; id: string }[] {
  return []
}

interface PlacePageProps {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: PlacePageProps): Promise<Metadata> {
  const { locale, id } = await params
  const supabase = createPublicClient()
  const { data: place } = await supabase
    .from('places')
    .select('name, city, category, address')
    .eq('id', id)
    .single()
  if (!place) return { title: 'K컬처MAP' }
  const title = `${place.name} - K컬처MAP`
  const description = [place.city, place.category, place.address].filter(Boolean).join(' · ')
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: alternatesFor(locale, `/places/${id}`),
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/places/${id}`,
      siteName: 'K컬처MAP',
      locale,
      type: 'article',
    },
  }
}

export default async function PlacePage({ params }: PlacePageProps) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const supabase = createPublicClient()

  const { data: place } = await supabase
    .from('places')
    .select('*')
    .eq('id', id)
    .single()

  if (!place) notFound()

  // 같은 카테고리 관련 장소 4개
  const { data: related } = await supabase
    .from('places')
    .select('id, name, category, city, district, photo_url, emoji, rating')
    .eq('category', place.category)
    .neq('id', id)
    .limit(4)

  return (
    <>
      <Header locale={locale} />
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr_160px] gap-6">
          <Sidebar position="left" className="hidden md:block" />
          <div className="flex flex-col gap-6 min-w-0">
            <PlaceDetail place={place} locale={locale} />
            {related && related.length > 0 && (
              <RelatedPlaces places={related} locale={locale} category={place.category} />
            )}
          </div>
          <Sidebar position="right" className="hidden md:block" />
        </div>
      </main>
    </>
  )
}
