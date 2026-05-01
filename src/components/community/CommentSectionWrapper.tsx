'use client'

import dynamic from 'next/dynamic'

const CommentSection = dynamic(
  () => import('./CommentSection'),
  { ssr: false, loading: () => <div className="bg-white border border-gray-100 rounded-2xl p-5 text-sm text-gray-400">댓글 불러오는 중...</div> }
)

interface Comment {
  id: string
  post_id: string
  user_name: string
  content: string
  created_at: string
  parent_id: string | null
  nation?: string
  user_id?: string
  avatar_url?: string
  user_level_emoji?: string
}

interface Props {
  comments: Comment[]
  postId: string
  locale: string
}

export default function CommentSectionWrapper({ comments, postId, locale }: Props) {
  return <CommentSection comments={comments} postId={postId} locale={locale} />
}
