import Link from 'next/link'

interface Post {
  id: string
  title: string
  category?: string
  city?: string
  likes?: number
}

interface BestReviewsProps {
  posts: Post[]
  locale: string
}

export default function BestReviews({ posts, locale }: BestReviewsProps) {
  const isKo = locale === 'ko'

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-800">
          ⭐ {isKo ? '베스트 여행 후기' : 'Best Travel Reviews'}
        </h2>
        <Link
          href={`/${locale}/community?sort=best`}
          className="text-xs text-gray-400 hover:text-sky-600 transition-colors"
        >
          {isKo ? '더보기 →' : 'View all →'}
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {posts.map((post, idx) => {
          const likeCount = post.likes ?? 0
          const isTop = idx < 2

          return (
            <Link
              key={post.id}
              href={`/${locale}/community/${post.id}`}
              className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-sky-200 hover:shadow-sm transition-all"
            >
              <span
                className={`text-lg font-bold min-w-[24px] text-center ${
                  isTop ? 'text-red-500' : 'text-sky-600'
                }`}
              >
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{post.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  👍 {likeCount}
                  {post.city && ` · ${post.city}`}
                </p>
              </div>
              <span className="text-gray-300 text-sm">›</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
