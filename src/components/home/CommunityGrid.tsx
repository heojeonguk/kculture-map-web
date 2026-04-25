import Link from 'next/link'

interface Post {
  id: string
  title: string
  category?: string
  city?: string
  likes?: number
}

interface CommunityGridProps {
  posts: Post[]
  locale: string
}

const categoryLabel: Record<string, { ko: string; en: string; color: string }> = {
  food: { ko: '맛집', en: 'Food', color: 'text-orange-500' },
  spot: { ko: '명소', en: 'Spot', color: 'text-green-500' },
  cafe: { ko: '카페', en: 'Cafe', color: 'text-amber-500' },
  activity: { ko: '액티비티', en: 'Activity', color: 'text-blue-500' },
  free: { ko: '자유', en: 'Free', color: 'text-gray-500' },
  review: { ko: '후기', en: 'Review', color: 'text-purple-500' },
}

export default function CommunityGrid({ posts, locale }: CommunityGridProps) {
  const isKo = locale === 'ko'

  if (!posts || posts.length === 0) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-800">
          💬 {isKo ? '커뮤니티 최신글' : 'Latest Posts'}
        </h2>
        <Link
          href={`/${locale}/community`}
          className="text-xs text-gray-400 hover:text-emerald-600 transition-colors"
        >
          {isKo ? '더보기 →' : 'View all →'}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {posts.map((post) => {
          const likeCount = post.likes ?? 0
          const cat = categoryLabel[post.category ?? 'free'] ?? categoryLabel.free

          return (
            <Link
              key={post.id}
              href={`/${locale}/community/${post.id}`}
              className="bg-white border border-gray-100 rounded-xl p-3.5 hover:border-emerald-200 hover:shadow-sm transition-all"
            >
              <p className={`text-xs font-semibold mb-1.5 ${cat.color}`}>
                {isKo ? cat.ko : cat.en}
              </p>
              <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
                {post.title}
              </p>
              <div className="flex gap-3 mt-2 text-xs text-gray-400">
                <span>👍 {likeCount}</span>
                {post.city && <span>{post.city}</span>}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
