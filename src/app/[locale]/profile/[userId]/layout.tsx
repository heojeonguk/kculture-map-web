import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = 'https://www.kculture-map.com'

interface ProfileLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string; userId: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; userId: string }> }): Promise<Metadata> {
  const { locale, userId } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('nicknames')
    .select('nickname')
    .eq('user_id', userId)
    .single()
  const nickname = data?.nickname
  const title = nickname
    ? `${nickname} - K컬처MAP`
    : locale === 'ko' ? 'K컬처MAP - 프로필' : 'K컬처MAP - Profile'
  return {
    title,
    robots: { index: true, follow: true },
    alternates: { canonical: `${BASE_URL}/${locale}/profile/${userId}` },
    openGraph: {
      title,
      url: `${BASE_URL}/${locale}/profile/${userId}`,
      siteName: 'K컬처MAP',
      locale,
      type: 'profile',
    },
  }
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return <>{children}</>
}
