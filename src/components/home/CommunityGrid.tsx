'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

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

const categoryColor: Record<string, string> = {
  food: 'text-orange-500',
  spot: 'text-green-500',
  cafe: 'text-amber-500',
  activity: 'text-blue-500',
  free: 'text-gray-500',
  review: 'text-purple-500',
}

export default function CommunityGrid({ posts, locale }: CommunityGridProps) {
  const t = useTranslations('home')
  const tCategory = useTranslations('category')

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-800">
          💬 {t('latestPosts')}
        </h2>
        <Link
          href={`/${locale}/community`}
          className="text-xs text-gray-400 hover:text-sky-600 transition-colors"
        >
          {t('viewAll')}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {posts.map((post) => {
          const likeCount = post.likes ?? 0
          const color = categoryColor[post.category ?? 'free'] ?? categoryColor.free

          return (
            <Link
              key={post.id}
              href={`/${locale}/community/${post.id}`}
              className="bg-white border border-gray-100 rounded-xl p-3.5 hover:border-sky-200 hover:shadow-sm transition-all"
            >
              <p className={`text-xs font-semibold mb-1.5 ${color}`}>
                {tCategory(post.category ?? 'free')}
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
