import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import PostDetail from '@/components/community/PostDetail'
import CommentSectionWrapper from '@/components/community/CommentSectionWrapper'

const BASE_URL = 'https://www.kculture-map.com'

interface PostPageProps {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { locale, id } = await params
  const supabase = await createClient()
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
    alternates: { canonical: `${BASE_URL}/${locale}/community/${id}` },
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
  const supabase = await createClient()

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
