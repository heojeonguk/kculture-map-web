'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { POSTS_PAGE_SIZE } from '@/lib/pagination'
import PostFilter from './PostFilter'
import PostList from './PostList'

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

interface CommunityBrowserProps {
  locale: string
  /** 서버가 ISR로 미리 렌더한 "필터 없는 최신순 1페이지" 결과 */
  initialPosts: Post[]
  initialCount: number
}

interface Result {
  key: string
  posts: Post[]
  count: number
}

const POST_COLUMNS =
  'id, title, category, city, likes, created_at, user_name, nation, photo_url, post_comments(count)'

/**
 * 커뮤니티 목록 조회를 client로 옮긴 컴포넌트.
 * 기본 화면은 서버 ISR 결과를 그대로 쓰고, 필터·검색·페이지네이션만
 * 브라우저에서 조회해 서버 CPU를 쓰지 않는다.
 */
export default function CommunityBrowser({
  locale,
  initialPosts,
  initialCount,
}: CommunityBrowserProps) {
  const t = useTranslations('common')
  const searchParams = useSearchParams()
  const isKo = locale === 'ko'

  const category = searchParams.get('category') ?? undefined
  const sort = searchParams.get('sort') ?? 'latest'
  const q = searchParams.get('q') ?? undefined
  const author = searchParams.get('author') ?? undefined
  const tag = searchParams.get('tag') ?? undefined
  const rawPage = Number(searchParams.get('page') ?? 1)
  const currentPage = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1

  const isDefaultView =
    !author && !tag && !q && currentPage === 1 && sort === 'latest' &&
    (!category || category === 'all')
  const queryKey = JSON.stringify([author, tag, category, q, sort, currentPage])

  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    // 기본 화면은 서버가 준 결과를 쓰므로 조회하지 않는다.
    if (isDefaultView) return

    let cancelled = false
    const offset = (currentPage - 1) * POSTS_PAGE_SIZE
    const supabase = createClient()

    let query = supabase.from('posts').select(POST_COLUMNS, { count: 'exact' })

    if (author) {
      query = query.eq('user_id', author)
    } else if (tag) {
      query = query.contains('tags', [tag])
    } else {
      if (category && category !== 'all') query = query.eq('category', category)
      if (q) query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`)
    }

    query = sort === 'best'
      ? query.order('likes', { ascending: false })
      : query.order('created_at', { ascending: false })

    query.range(offset, offset + POSTS_PAGE_SIZE - 1).then(({ data, count }) => {
      if (cancelled) return
      setResult({
        key: queryKey,
        posts: (data ?? []) as unknown as Post[],
        count: count ?? 0,
      })
    })

    return () => {
      cancelled = true
    }
  }, [isDefaultView, queryKey, author, tag, category, q, sort, currentPage])

  // 표시할 데이터는 state 동기화 없이 파생시킨다.
  const current = isDefaultView
    ? { posts: initialPosts, count: initialCount }
    : result?.key === queryKey
      ? result
      : null

  // 페이지네이션 링크가 현재 필터를 유지하도록 page 외 파라미터를 넘긴다.
  const filterParams = new URLSearchParams()
  if (author) filterParams.set('author', author)
  if (tag) filterParams.set('tag', tag)
  if (category) filterParams.set('category', category)
  if (q) filterParams.set('q', q)
  if (sort !== 'latest') filterParams.set('sort', sort)

  const authorName = author ? (current?.posts[0]?.user_name ?? author) : null

  return (
    <>
      {author ? (
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/community`}
            className="text-sm text-gray-400 hover:text-sky-500 transition-colors flex items-center gap-1"
          >
            ← {isKo ? '전체 게시글' : 'All posts'}
          </Link>
          <span className="text-gray-300">·</span>
          <h2 className="text-sm font-semibold text-gray-700">
            {authorName}{isKo ? '님의 게시글' : "'s posts"}
          </h2>
        </div>
      ) : tag ? (
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/community`}
            className="text-sm text-gray-400 hover:text-sky-500 transition-colors flex items-center gap-1"
          >
            ← {isKo ? '전체 게시글' : 'All posts'}
          </Link>
          <span className="text-gray-300">·</span>
          <h2 className="text-sm font-semibold text-blue-600">#{tag}</h2>
          <span className="text-xs text-gray-400">{isKo ? '로 검색 중' : 'results'}</span>
        </div>
      ) : (
        <PostFilter
          key={q ?? ''}
          locale={locale}
          activeCategory={category}
          activeSort={sort}
          searchQuery={q}
        />
      )}

      {current ? (
        <PostList
          posts={current.posts}
          locale={locale}
          currentPage={currentPage}
          totalPages={Math.ceil(current.count / POSTS_PAGE_SIZE)}
          totalCount={current.count}
          filterQuery={filterParams.toString()}
        />
      ) : (
        <p className="py-20 text-center text-sm text-gray-400">{t('loading')}</p>
      )}
    </>
  )
}
