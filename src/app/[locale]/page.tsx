import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Sidebar from '@/components/layout/Sidebar'
import SearchZone from '@/components/home/SearchZone'
import PlaceGrid from '@/components/home/PlaceGrid'
// import BannerAd from '@/components/home/BannerAd'
import BestReviews from '@/components/home/BestReviews'
import BestPhotos from '@/components/home/BestPhotos'
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

  const { data: bestPhotosRaw } = await supabase
    .from('user_photos')
    .select('*')
    .order('likes_count', { ascending: false })
    .limit(6)

  const bestPhotos = await Promise.all(
    (bestPhotosRaw ?? []).map(async (photo) => {
      const [{ data: nick }, { data: post }] = await Promise.all([
        supabase.from('nicknames').select('nickname').eq('user_id', photo.user_id).single(),
        supabase.from('posts').select('avatar_url, user_level_emoji').eq('user_id', photo.user_id).not('avatar_url', 'is', null).limit(1).single(),
      ])
      return {
        ...photo,
        nickname: nick?.nickname ?? null,
        avatar_url: post?.avatar_url ?? null,
        user_level_emoji: post?.user_level_emoji ?? null,
      }
    })
  )

  // 커뮤니티 최신글 4개
  const { data: latestPosts } = await supabase
    .from('posts')
    .select('id, title, category, city, likes, photo_url, user_name, nation, created_at, post_comments(count)')
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
            {/* <BannerAd /> */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BestPhotos photos={bestPhotos ?? []} locale={locale} />
              <BestReviews posts={bestPosts ?? []} locale={locale} />
            </div>
            <CommunityGrid posts={latestPosts ?? []} locale={locale} />
          </div>

          <Sidebar position="right" />
        </div>
      </main>
      <Footer locale={locale} />
    </>
  )
}
