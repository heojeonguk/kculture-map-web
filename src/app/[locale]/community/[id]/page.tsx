import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import PostDetail from '@/components/community/PostDetail'
import CommentSectionWrapper from '@/components/community/CommentSectionWrapper'

interface PostPageProps {
  params: Promise<{ locale: string; id: string }>
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
        <div className="grid grid-cols-[160px_1fr_160px] gap-6">
          <Sidebar position="left" />
          <div className="flex flex-col gap-4 min-w-0">
            <PostDetail post={serializedPost} locale={locale} />
            <CommentSectionWrapper comments={serializedComments} postId={id} locale={locale} />
          </div>
          <Sidebar position="right" />
        </div>
      </main>
    </>
  )
}
