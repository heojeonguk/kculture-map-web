import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
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

  // 인기 장소 4개
  const { data: popularPlaces } = await supabase
    .from('places')
    .select('id, name, category, city, district, image_url')
    .limit(4)
    .order('created_at', { ascending: false })

  // 베스트 후기 5개
  const { data: bestPosts } = await supabase
    .from('posts')
    .select('id, title, category, city, post_likes(count), post_comments(count)')
    .order('created_at', { ascending: false })
    .limit(5)

  // 커뮤니티 최신글 4개
  const { data: latestPosts } = await supabase
    .from('posts')
    .select('id, title, category, city, post_likes(count), post_comments(count)')
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
    </>
  )
}
