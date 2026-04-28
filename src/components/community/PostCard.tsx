import Link from 'next/link'

interface Post {
  id: string
  title: string
  category?: string
  city?: string
  likes?: number
  created_at: string
  user_name?: string
  nation?: string
  photo_url?: string
  tags?: string[]
  post_comments?: { count: number }[]
}

interface PostCardProps {
  post: Post
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

function timeAgo(dateStr: string, isKo: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return isKo ? '방금 전' : 'just now'
  if (mins < 60) return isKo ? `${mins}분 전` : `${mins}m ago`
  if (hours < 24) return isKo ? `${hours}시간 전` : `${hours}h ago`
  return isKo ? `${days}일 전` : `${days}d ago`
}

export default function PostCard({ post, locale }: PostCardProps) {
  const isKo = locale === 'ko'
  const cat = categoryLabel[post.category ?? 'free'] ?? categoryLabel.free
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
          className="w-24 h-24 rounded-xl object-cover shrink-0"
        />
      )}

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        {/* 카테고리 + 시간 */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.color}`}>
            {isKo ? cat.ko : cat.en}
          </span>
          {post.city && (
            <span className="text-[10px] text-gray-400">{post.city}</span>
          )}
          <span className="text-[10px] text-gray-300 ml-auto shrink-0">
            {timeAgo(post.created_at, isKo)}
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
          <span className="text-xs text-gray-400">
            {post.nation ?? ''} {post.user_name ?? (isKo ? '익명' : 'Anonymous')}
          </span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-gray-400">👍 {post.likes ?? 0}</span>
          <span className="text-xs text-gray-400">💬 {commentCount}</span>
        </div>
      </div>
    </Link>
  )
}
