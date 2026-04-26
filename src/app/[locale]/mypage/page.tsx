import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import ProfileCard from '@/components/mypage/ProfileCard'
import MyPosts from '@/components/mypage/MyPosts'

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

  // 내 게시글
  const { data: myPosts } = await supabase
    .from('posts')
    .select('id, title, category, city, likes, created_at, post_comments(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Header locale={locale} />
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid grid-cols-[160px_1fr_160px] gap-6">
          <Sidebar position="left" />
          <div className="flex flex-col gap-5 min-w-0">
            <ProfileCard user={user} locale={locale} />
            <MyPosts posts={myPosts ?? []} locale={locale} />
          </div>
          <Sidebar position="right" />
        </div>
      </main>
    </>
  )
}
