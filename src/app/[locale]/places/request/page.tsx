import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Sidebar from '@/components/layout/Sidebar'
import PlaceRequestForm from '@/components/places/PlaceRequestForm'

const BASE_URL = 'https://www.kculture-map.com'

interface PlaceRequestPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PlaceRequestPageProps): Promise<Metadata> {
  const { locale } = await params
  const title = locale === 'ko' ? 'K컬처MAP - 장소 등록 요청' : 'K컬처MAP - Request a Place'
  const description =
    locale === 'ko'
      ? '알려지지 않은 좋은 장소나 내 가게를 K컬처MAP에 등록 요청하세요'
      : 'Submit a hidden gem or your own business to be listed on K컬처MAP'
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: `${BASE_URL}/${locale}/places/request` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/places/request`,
      siteName: 'K컬처MAP',
      locale,
      type: 'website',
    },
  }
}

export default async function PlaceRequestPage({ params }: PlaceRequestPageProps) {
  const { locale } = await params

  return (
    <>
      <Header locale={locale} />
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr_160px] gap-6">
          <Sidebar position="left" className="hidden md:block" />
          <div className="min-w-0">
            <PlaceRequestForm locale={locale} />
          </div>
          <Sidebar position="right" className="hidden md:block" />
        </div>
      </main>
      <Footer locale={locale} />
    </>
  )
}
