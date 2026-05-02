import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import AIRecommendForm from '@/components/ai/AIRecommendForm'
import Footer from '@/components/layout/Footer'

interface AIPageProps {
  params: Promise<{ locale: string }>
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
