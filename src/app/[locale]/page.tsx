import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Sidebar from '@/components/layout/Sidebar'
import SearchZone from '@/components/home/SearchZone'
import PlaceGrid from '@/components/home/PlaceGrid'
import BannerAd from '@/components/home/BannerAd'
import BestReviews from '@/components/home/BestReviews'
import CommunityGrid from '@/components/home/CommunityGrid'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: popularPlaces, error: placesError } = await supabase
    .from('places')
    .select('id, name, category, city, district, photo_url, emoji')
    .limit(4)
    .order('created_at', { ascending: false })

  console.log('places data:', popularPlaces)
  console.log('places error:', placesError)

  const { data: bestPosts, error: postsError } = await supabase
    .from('posts')
    .select('id, title, category, city, likes')
    .order('likes', { ascending: false })
    .limit(5)

  console.log('posts data:', bestPosts)
  console.log('posts error:', postsError)

  // 커뮤니티 최신글 4개 - 조인 제거
  const { data: latestPosts } = await supabase
    .from('posts')
    .select('id, title, category, city, likes')
    .order('created_at', { ascending: false })
    .limit(4)

  return (
    <>
      <Header locale={locale} />
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid grid-cols-[160px_1fr_160px] gap-6">
          <Sidebar position="left" />

          <div className="flex flex-col gap-6 min-w-0">
            <SearchZone locale={locale} />
            <PlaceGrid places={popularPlaces ?? []} locale={locale} />
            <BannerAd />
            <BestReviews posts={bestPosts ?? []} locale={locale} />
            <CommunityGrid posts={latestPosts ?? []} locale={locale} />
          </div>

          <Sidebar position="right" />
        </div>
      </main>
      <Footer locale={locale} />
    </>
  )
}
