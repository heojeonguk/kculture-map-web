import Link from 'next/link'

interface Post {
  id: string
  title: string
  content: string
  category?: string
  city?: string
  likes?: number
  created_at: string
  user_name?: string
  nation?: string
  avatar_url?: string
  photo_url?: string
  user_level_emoji?: string
}

interface PostDetailProps {
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

export default function PostDetail({ post, locale }: PostDetailProps) {
  const isKo = locale === 'ko'
  const cat = categoryLabel[post.category ?? 'free'] ?? categoryLabel.free
  const date = new Date(post.created_at).toLocaleDateString(
    isKo ? 'ko-KR' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )

  return (
    <div className="flex flex-col gap-4">
      {/* 뒤로가기 */}
      <Link
        href={`/${locale}/community`}
        className="text-sm text-gray-400 hover:text-sky-500 transition-colors flex items-center gap-1 w-fit"
      >
        ← {isKo ? '커뮤니티' : 'Back to community'}
      </Link>

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        {/* 카테고리 + 날짜 */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cat.color}`}>
            {isKo ? cat.ko : cat.en}
          </span>
          {post.city && (
            <span className="text-xs text-gray-400">📍 {post.city}</span>
          )}
          <span className="text-xs text-gray-300 ml-auto">{date}</span>
        </div>

        {/* 제목 */}
        <h1 className="text-xl font-bold text-gray-900 mb-4">{post.title}</h1>

        {/* 작성자 */}
        <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
          {post.avatar_url ? (
            <img
              src={post.avatar_url}
              alt={post.user_name ?? ''}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sm">
              {post.user_level_emoji ?? '👤'}
            </div>
          )}
          <span className="text-sm font-medium text-gray-700">
            {post.nation ?? ''} {post.user_name ?? (isKo ? '익명' : 'Anonymous')}
          </span>
        </div>

        {/* 본문 */}
        <div className="py-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>

        {/* 사진 */}
        {post.photo_url && (
          <div className="w-full rounded-xl overflow-hidden mt-2">
            <img
              src={post.photo_url}
              alt={post.title}
              className="w-full max-h-96 object-cover rounded-xl"
            />
          </div>
        )}

        {/* 좋아요 */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">👍 {post.likes ?? 0}</span>
        </div>
      </div>
    </div>
  )
}
