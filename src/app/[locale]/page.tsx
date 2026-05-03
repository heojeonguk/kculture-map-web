import type { Metadata } from 'next'
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

const BASE_URL = 'https://www.kculture-map.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const titles: Record<string, string> = {
    ko: 'K컬처MAP - 한국 여행의 모든 것',
    en: 'K컬처MAP - Everything About Korea Travel',
    ja: 'K컬처MAP - 韓国旅行のすべて',
    'zh-CN': 'K컬처MAP - 韩国旅行指南',
  }
  const descs: Record<string, string> = {
    ko: '한국 맛집, 명소, 카페, 쇼핑, 액티비티를 한 곳에서',
    en: 'Discover Korean restaurants, spots, cafes, shopping & activities',
    ja: '韓国グルメ、観光地、カフェ、ショッピングを一か所で',
    'zh-CN': '发现韩国美食、景点、咖啡厅、购物和活动',
  }
  const title = titles[locale] ?? titles.en
  const description = descs[locale] ?? descs.en
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: `${BASE_URL}/${locale}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}`,
      siteName: 'K컬처MAP',
      locale,
      type: 'website',
    },
  }
}

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
    .not('photo_url', 'is', null)
    .order('rating', { ascending: false })
    .limit(8)

  console.log('places data:', popularPlaces)
  console.log('places error:', placesError)

  const { data: bestPosts, error: postsError } = await supabase
    .from('posts')
    .select('id, title, category, city, likes')
    .order('likes', { ascending: false })
    .limit(5)

  console.log('posts data:', bestPosts)
  console.log('posts error:', postsError)

  const { data: photosRaw } = await supabase
    .from('user_photos')
    .select('*')
    .order('likes_count', { ascending: false })
    .limit(6)

  const userIds = [...new Set((photosRaw ?? []).map(p => p.user_id))]

  const [{ data: nicknamesData }, { data: postsData }] = await Promise.all([
    supabase.from('nicknames').select('user_id, nickname').in('user_id', userIds),
    supabase.from('posts')
      .select('user_id, avatar_url, user_level_emoji')
      .in('user_id', userIds)
      .not('avatar_url', 'is', null)
      .order('created_at', { ascending: false }),
  ])

  const bestPhotos = (photosRaw ?? []).map(photo => {
    const nick = nicknamesData?.find(n => n.user_id === photo.user_id)
    const post = postsData?.find(p => p.user_id === photo.user_id)
    return {
      ...photo,
      nickname: nick?.nickname ?? null,
      avatar_url: post?.avatar_url ?? null,
      user_level_emoji: post?.user_level_emoji ?? null,
    }
  })

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
