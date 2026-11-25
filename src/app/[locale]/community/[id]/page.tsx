import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createPublicClient } from '@/lib/supabase/public'
import { BASE_URL, alternatesFor } from '@/lib/seo'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import PostDetail from '@/components/community/PostDetail'
import CommentSectionWrapper from '@/components/community/CommentSectionWrapper'

// 5분 ISR. 좋아요·북마크 등 사용자별 상태는 client에서 따로 불러온다.
export const revalidate = 300

/**
 * 빌드 시에는 한 페이지도 만들지 않는다 (수만 페이지 생성 방지).
 * 다만 빈 배열이라도 선언해야 Next.js 16이 이 라우트를 ISR로 등록한다.
 * 선언이 없으면 revalidate가 무시되고 요청마다 서버 렌더링된다.
 * 실제 페이지는 첫 요청 때 생성되어 이후 revalidate 기간 동안 캐시된다.
 */
export function generateStaticParams(): { locale: string; id: string }[] {
  return []
}

interface PostPageProps {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { locale, id } = await params
  const supabase = createPublicClient()
  const { data: post } = await supabase
    .from('posts')
    .select('title, content')
    .eq('id', id)
    .single()
  if (!post) return { title: 'K컬처MAP' }
  const title = `${post.title} - K컬처MAP`
  const description = (post.content as string)?.replace(/<[^>]*>/g, '').slice(0, 100) ?? ''
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: alternatesFor(locale, `/community/${id}`),
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/community/${id}`,
      siteName: 'K컬처MAP',
      locale,
      type: 'article',
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const supabase = createPublicClient()

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (!post) notFound()

  const { data: comments } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', id)
    .order('created_at', { ascending: true })

  // JSON 직렬화로 hydration 에러 방지
  const serializedComments = JSON.parse(JSON.stringify(comments ?? []))
  const serializedPost = JSON.parse(JSON.stringify(post))

  return (
    <>
      <Header locale={locale} />
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr_160px] gap-6">
          <Sidebar position="left" className="hidden md:block" />
          <div className="flex flex-col gap-4 min-w-0">
            <PostDetail post={serializedPost} locale={locale} />
            <CommentSectionWrapper comments={serializedComments} postId={id} locale={locale} />
          </div>
          <Sidebar position="right" className="hidden md:block" />
        </div>
      </main>
    </>
  )
}
