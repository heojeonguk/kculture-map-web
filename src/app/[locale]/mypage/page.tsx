import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Sidebar from '@/components/layout/Sidebar'
import ProfileCard from '@/components/mypage/ProfileCard'
import MyPosts from '@/components/mypage/MyPosts'
import MyBookmarks from '@/components/mypage/MyBookmarks'

interface MypageProps {
  params: Promise<{ locale: string }>
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
      .select('id, title, category, city, likes, created_at, post_comments(count)')
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
      .select('place_id, places(id, name, name_en, category, city, emoji)')
      .eq('user_id', user.id),
  ])

  return (
    <>
      <Header locale={locale} />
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid grid-cols-[160px_1fr_160px] gap-6">
          <Sidebar position="left" />
          <div className="flex flex-col gap-5 min-w-0">
            <ProfileCard
              user={user}
              locale={locale}
              postCount={myPosts?.length ?? 0}
              commentCount={commentCount ?? 0}
              followerCount={followerCount ?? 0}
            />
            <div className="flex items-center gap-4 px-1 text-sm text-gray-500">
              <span>👥 {locale === 'ko' ? `팔로워 ${followerCount ?? 0}명` : `${followerCount ?? 0} followers`}</span>
              <span className="text-gray-300">·</span>
              <span>{locale === 'ko' ? `팔로잉 ${followingCount ?? 0}명` : `Following ${followingCount ?? 0}`}</span>
            </div>
            <MyPosts posts={myPosts ?? []} locale={locale} />
            <MyBookmarks bookmarks={(bookmarks ?? []) as any} locale={locale} />
          </div>
          <Sidebar position="right" />
        </div>
      </main>
      <Footer locale={locale} />
    </>
  )
}
