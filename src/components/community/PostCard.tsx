'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface Post {
  id: string
  title: string
  category?: string
  city?: string
  likes?: number
  created_at: string
  user_name?: string
  user_level_emoji?: string
  nation?: string
  photo_url?: string
  tags?: string[]
  post_comments?: { count: number }[]
}

interface PostCardProps {
  post: Post
  locale: string
}

const categoryColor: Record<string, string> = {
  food: 'text-orange-500 bg-orange-50',
  spot: 'text-blue-500 bg-blue-50',
  cafe: 'text-amber-500 bg-amber-50',
  activity: 'text-sky-500 bg-sky-50',
  free: 'text-gray-500 bg-gray-100',
  review: 'text-purple-500 bg-purple-50',
}

function timeAgo(dateStr: string, locale: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (mins < 1) return rtf.format(0, 'second')
  if (mins < 60) return rtf.format(-mins, 'minute')
  if (hours < 24) return rtf.format(-hours, 'hour')
  return rtf.format(-days, 'day')
}

export default function PostCard({ post, locale }: PostCardProps) {
  const t = useTranslations('community')
  const tCategory = useTranslations('category')
  const color = categoryColor[post.category ?? 'free'] ?? categoryColor.free
  const commentCount = post.post_comments?.[0]?.count ?? 0

  return (
    <Link
      href={`/${locale}/community/${post.id}`}
      className="bg-white border border-gray-100 rounded-xl p-4 hover:border-sky-200 hover:shadow-sm transition-all flex gap-4"
    >
      {/* 썸네일 */}
      {post.photo_url && (
        <img
          src={post.photo_url}
          alt={post.title}
          loading="lazy"
          decoding="async"
          className="w-24 h-24 rounded-xl object-cover shrink-0"
        />
      )}

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        {/* 카테고리 + 시간 */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
            {tCategory(post.category ?? 'free')}
          </span>
          {post.city && (
            <span className="text-[10px] text-gray-400">{post.city}</span>
          )}
          <span className="text-[10px] text-gray-300 ml-auto shrink-0">
            {timeAgo(post.created_at, locale)}
          </span>
        </div>

        {/* 제목 */}
        <p className="text-sm font-semibold text-gray-800 truncate mb-1">{post.title}</p>

        {/* 태그 */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-1.5">
            {post.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 하단 메타 */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {post.user_level_emoji && <span className="text-sm">{post.user_level_emoji}</span>}
            {post.nation ?? ''} {post.user_name ?? t('anonymous')}
          </span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-gray-400">👍 {post.likes ?? 0}</span>
          <span className="text-xs text-gray-400">💬 {commentCount}</span>
        </div>
      </div>
    </Link>
  )
}
