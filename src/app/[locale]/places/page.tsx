import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Sidebar from '@/components/layout/Sidebar'
import PlaceFilter from '@/components/places/PlaceFilter'
import PlaceList from '@/components/places/PlaceList'

const BASE_URL = 'https://www.kculture-map.com'

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
    alternates: { canonical: `${BASE_URL}/${locale}/places` },
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

interface PlacesPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    category?: string
    city?: string
    q?: string
    page?: string
  }>
}

const PAGE_SIZE = 12

export default async function PlacesPage({ params, searchParams }: PlacesPageProps) {
  const { locale } = await params
  const { category, city, q, page } = await searchParams
  const currentPage = Number(page ?? 1)
  const offset = (currentPage - 1) * PAGE_SIZE

  const supabase = await createClient()

  let query = supabase
    .from('places')
    .select('id, name, category, city, district, photo_url, emoji, rating, address', { count: 'exact' })

  if (category) query = query.eq('category', category)
  if (city) query = query.eq('city', city)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data: places, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <>
      <Header locale={locale} />
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid grid-cols-[160px_1fr_160px] gap-6">
          <Sidebar position="left" />

          <div className="flex flex-col gap-5 min-w-0">
            <PlaceFilter
              locale={locale}
              activeCategory={category}
              activeCity={city}
              searchQuery={q}
            />
            <PlaceList
              places={places ?? []}
              locale={locale}
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={count ?? 0}
            />
          </div>

          <Sidebar position="right" />
        </div>
      </main>
      <Footer locale={locale} />
    </>
  )
}
