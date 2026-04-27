'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Post {
  id: string
  title: string
  category?: string
  city?: string
  likes?: number
  created_at: string
  post_comments?: { count: number }[]
}

interface MyPostsProps {
  posts: Post[]
  locale: string
}

const categoryLabel: Record<string, { ko: string; en: string; color: string }> = {
  food: { ko: '맛집', en: 'Food', color: 'text-orange-500 bg-orange-50' },
  spot: { ko: '명소', en: 'Spot', color: 'text-blue-500 bg-blue-50' },
  cafe: { ko: '카페', en: 'Cafe', color: 'text-amber-500 bg-amber-50' },
  activity: { ko: '액티비티', en: 'Activity', color: 'text-sky-500 bg-sky-50' },
  free: { ko: '자유', en: 'Free', color: 'text-gray-500 bg-gray-100' },
  review: { ko: '후기', en: 'Review', color: 'text-purple-500 bg-purple-50' },
}

export default function MyPosts({ posts: initialPosts, locale }: MyPostsProps) {
  const isKo = locale === 'ko'
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>(initialPosts)

  const handleDelete = async (postId: string) => {
    const confirmed = window.confirm(
      isKo ? '정말 삭제하시겠습니까?' : 'Are you sure you want to delete this post?'
    )
    if (!confirmed) return

    const supabase = createClient()
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== postId))
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-800">
          📝 {isKo ? `내 게시글 ${posts.length}개` : `My Posts (${posts.length})`}
        </h2>
        <Link
          href={`/${locale}/community/write`}
          className="text-xs bg-sky-500 text-white px-3 py-1.5 rounded-full hover:bg-sky-600 transition-colors"
        >
          ✏️ {isKo ? '글쓰기' : 'Write'}
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <span className="text-4xl mb-3">📭</span>
          <p className="text-sm">{isKo ? '아직 작성한 게시글이 없습니다' : 'No posts yet'}</p>
          <Link
            href={`/${locale}/community/write`}
            className="mt-3 text-xs text-sky-500 hover:text-sky-600"
          >
            {isKo ? '첫 게시글 작성하기 →' : 'Write your first post →'}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {posts.map((post) => {
            const cat = categoryLabel[post.category ?? 'free'] ?? categoryLabel.free
            const commentCount = post.post_comments?.[0]?.count ?? 0
            const date = new Date(post.created_at).toLocaleDateString(
              isKo ? 'ko-KR' : 'en-US',
              { month: 'short', day: 'numeric' }
            )

            return (
              <div
                key={post.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
              >
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${cat.color}`}>
                  {isKo ? cat.ko : cat.en}
                </span>
                <Link
                  href={`/${locale}/community/${post.id}`}
                  className="text-sm text-gray-700 flex-1 truncate hover:text-sky-500 transition-colors"
                >
                  {post.title}
                </Link>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 shrink-0">
                  <span>👍 {post.likes ?? 0}</span>
                  <span>💬 {commentCount}</span>
                  <span>{date}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => router.push(`/${locale}/community/edit/${post.id}`)}
                    className="text-xs text-sky-500 hover:underline"
                  >
                    {isKo ? '수정' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    {isKo ? '삭제' : 'Delete'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
