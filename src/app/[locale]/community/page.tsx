import type { Metadata } from 'next'
import { Suspense } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { createPublicClient } from '@/lib/supabase/public'
import { BASE_URL, alternatesFor } from '@/lib/seo'
import { POSTS_PAGE_SIZE } from '@/lib/pagination'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Sidebar from '@/components/layout/Sidebar'
import PostFilter from '@/components/community/PostFilter'
import PostList from '@/components/community/PostList'
import CommunityBrowser from '@/components/community/CommunityBrowser'

// 5분 ISR. searchParams를 서버에서 읽지 않으므로 필터/검색/페이지네이션이
// 붙어도 같은 캐시 HTML로 응답되고, 조회는 client에서 처리한다.
export const revalidate = 300

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const title = locale === 'ko' ? 'K컬처MAP - 커뮤니티' : 'K컬처MAP - Community'
  const description =
    locale === 'ko'
      ? '한국 여행 경험을 공유하고 소통하세요'
      : 'Share and connect with fellow Korea travel enthusiasts'
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: alternatesFor(locale, '/community'),
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/community`,
      siteName: 'K컬처MAP',
      locale,
      type: 'website',
    },
  }
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = createPublicClient()

  // 필터 없는 최신순 1페이지만 서버에서 렌더해 ISR로 캐시한다.
  const { data: posts, count } = await supabase
    .from('posts')
    .select(
      'id, title, category, city, likes, created_at, user_name, nation, photo_url, post_comments(count)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(0, POSTS_PAGE_SIZE - 1)

  const totalPages = Math.ceil((count ?? 0) / POSTS_PAGE_SIZE)

  /*
   * CommunityBrowser는 useSearchParams를 쓰므로 프리렌더 시 Suspense fallback으로
   * 대체된다. fallback에 서버에서 조회한 최신순 1페이지를 넣어 정적 HTML에
   * 실제 게시글 목록과 링크가 담기도록 한다(SEO + 크롤링 경로 확보).
   */
  const defaultView = (
    <>
      <PostFilter locale={locale} activeSort="latest" />
      <PostList
        posts={posts ?? []}
        locale={locale}
        currentPage={1}
        totalPages={totalPages}
        totalCount={count ?? 0}
      />
    </>
  )

  return (
    <>
      <Header locale={locale} />
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr_160px] gap-6">
          <Sidebar position="left" className="hidden md:block" />
          <div className="flex flex-col gap-5 min-w-0">
            <Suspense fallback={defaultView}>
              <CommunityBrowser
                locale={locale}
                initialPosts={posts ?? []}
                initialCount={count ?? 0}
              />
            </Suspense>
          </div>
          <Sidebar position="right" className="hidden md:block" />
        </div>
      </main>
      <Footer locale={locale} />
    </>
  )
}
