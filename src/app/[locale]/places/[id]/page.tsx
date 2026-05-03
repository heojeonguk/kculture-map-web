import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import PlaceDetail from '@/components/places/PlaceDetail'
import RelatedPlaces from '@/components/places/RelatedPlaces'

const BASE_URL = 'https://www.kculture-map.com'

interface PlacePageProps {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: PlacePageProps): Promise<Metadata> {
  const { locale, id } = await params
  const supabase = await createClient()
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
    alternates: { canonical: `${BASE_URL}/${locale}/places/${id}` },
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
  const supabase = await createClient()

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
