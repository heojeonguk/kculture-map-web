'use client'

import { useTranslations } from 'next-intl'
import PostCard from './PostCard'
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
  post_comments?: { count: number }[]
}

interface PostListProps {
  posts: Post[]
  locale: string
  currentPage: number
  totalPages: number
  totalCount: number
}

export default function PostList({ posts, locale, currentPage, totalPages, totalCount }: PostListProps) {
  const t = useTranslations('community')
  const tPlaces = useTranslations('places')

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <span className="text-5xl mb-4">📭</span>
        <p className="text-base font-medium">{t('noPosts')}</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">
        {t('total', { count: totalCount })}
      </p>

      <div className="flex flex-col gap-2">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} locale={locale} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {currentPage > 1 && (
            <Link
              href={`/${locale}/community?page=${currentPage - 1}`}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-sky-300 hover:text-sky-600 transition-colors"
            >
              ← {tPlaces('prev')}
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => Math.abs(p - currentPage) <= 2)
            .map((p) => (
              <Link
                key={p}
                href={`/${locale}/community?page=${p}`}
                className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm border transition-colors ${
                  p === currentPage
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'border-gray-200 text-gray-600 hover:border-sky-300 hover:text-sky-600'
                }`}
              >
                {p}
              </Link>
            ))}
          {currentPage < totalPages && (
            <Link
              href={`/${locale}/community?page=${currentPage + 1}`}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-sky-300 hover:text-sky-600 transition-colors"
            >
              {tPlaces('next')} →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
