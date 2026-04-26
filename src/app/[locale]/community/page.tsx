import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Sidebar from '@/components/layout/Sidebar'
import PostFilter from '@/components/community/PostFilter'
import PostList from '@/components/community/PostList'

interface CommunityPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    category?: string
    sort?: string
    page?: string
  }>
}

const PAGE_SIZE = 10

export default async function CommunityPage({ params, searchParams }: CommunityPageProps) {
  const { locale } = await params
  const { category, sort = 'latest', page } = await searchParams
  const currentPage = Number(page ?? 1)
  const offset = (currentPage - 1) * PAGE_SIZE

  const supabase = await createClient()

  let query = supabase
    .from('posts')
    .select('id, title, category, city, likes, created_at, user_name, nation, photo_url, post_comments(count)', { count: 'exact' })

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  if (sort === 'best') {
    query = query.order('likes', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: posts, count } = await query
    .range(offset, offset + PAGE_SIZE - 1)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <>
      <Header locale={locale} />
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid grid-cols-[160px_1fr_160px] gap-6">
          <Sidebar position="left" />
          <div className="flex flex-col gap-5 min-w-0">
            <PostFilter locale={locale} activeCategory={category} activeSort={sort} />
            <PostList
              posts={posts ?? []}
              locale={locale}
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={count ?? 0}
            />
          </div>
          <Sidebar position="right" />
        </div>
      </main>
      <Footer locale={locale} />
    </>
  )
}
