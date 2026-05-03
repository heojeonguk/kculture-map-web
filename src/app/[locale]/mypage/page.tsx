import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Sidebar from '@/components/layout/Sidebar'
import ProfileCard from '@/components/mypage/ProfileCard'
import MyPosts from '@/components/mypage/MyPosts'
import MyBookmarks from '@/components/mypage/MyBookmarks'
import MyPageClient from '@/components/mypage/MyPageClient'
import PhotoAlbum from '@/components/mypage/PhotoAlbum'

interface MypageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: MypageProps): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'ko' ? 'K컬처MAP - 마이페이지' : 'K컬처MAP - My Page',
    robots: { index: false, follow: false },
  }
}

export default async function MyPage({ params }: MypageProps) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  const [
    { data: myPosts },
    { count: commentCount },
    { count: followerCount },
    { count: followingCount },
    { data: bookmarks },
  ] = await Promise.all([
    supabase
      .from('posts')
      .select('id, title, category, city, likes, created_at, photo_url, post_comments(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id),
    supabase
      .from('place_bookmarks')
      .select('place_id, places!place_bookmarks_place_id_fkey(id, name, name_en, category, city, emoji)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <>
      <Header locale={locale} />
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr_160px] gap-6">
          <Sidebar position="left" className="hidden md:block" />
          <div className="flex flex-col gap-5 min-w-0">
            <ProfileCard
              user={user}
              locale={locale}
              postCount={myPosts?.length ?? 0}
              commentCount={commentCount ?? 0}
              followerCount={followerCount ?? 0}
            />
            <MyPageClient
              userId={user.id}
              locale={locale}
              followerCount={followerCount ?? 0}
              followingCount={followingCount ?? 0}
            />
            <PhotoAlbum userId={user.id} isOwner={true} locale={locale} />
            <MyPosts posts={myPosts ?? []} locale={locale} />
            <MyBookmarks bookmarks={(bookmarks ?? []) as any} locale={locale} />
          </div>
          <Sidebar position="right" className="hidden md:block" />
        </div>
      </main>
      <Footer locale={locale} />
    </>
  )
}
