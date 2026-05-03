import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import AIRecommendForm from '@/components/ai/AIRecommendForm'
import Footer from '@/components/layout/Footer'

const BASE_URL = 'https://www.kculture-map.com'

interface AIPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: AIPageProps): Promise<Metadata> {
  const { locale } = await params
  const title = locale === 'ko' ? 'K컬처MAP - AI 여행 추천' : 'K컬처MAP - AI Travel Recommendations'
  const description =
    locale === 'ko'
      ? 'AI가 당신에게 딱 맞는 한국 여행 코스를 추천해드립니다'
      : 'Get personalized Korea travel recommendations powered by AI'
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: `${BASE_URL}/${locale}/ai-recommend` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/ai-recommend`,
      siteName: 'K컬처MAP',
      locale,
      type: 'website',
    },
  }
}

export default async function AIRecommendPage({ params }: AIPageProps) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  return (
    <>
      <Header locale={locale} />
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid grid-cols-[160px_1fr_160px] gap-6">
          <Sidebar position="left" />
          <div className="min-w-0">
            <AIRecommendForm locale={locale} />
          </div>
          <Sidebar position="right" />
        </div>
      </main>
      <Footer locale={locale} />
    </>
  )
}
