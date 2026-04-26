import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'

interface SearchPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; category?: string }>
}

const categoryLabel: Record<string, { ko: string; en: string; color: string }> = {
  food: { ko: '맛집', en: 'Food', color: 'text-orange-500 bg-orange-50' },
  spot: { ko: '명소', en: 'Spot', color: 'text-blue-500 bg-blue-50' },
  cafe: { ko: '카페', en: 'Cafe', color: 'text-amber-500 bg-amber-50' },
  activity: { ko: '액티비티', en: 'Activity', color: 'text-sky-500 bg-sky-50' },
  shopping: { ko: '쇼핑', en: 'Shop', color: 'text-pink-500 bg-pink-50' },
  free: { ko: '자유', en: 'Free', color: 'text-gray-500 bg-gray-100' },
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params
  const { q, category } = await searchParams
  const isKo = locale === 'ko'

  if (!q) {
    return (
      <>
        <Header locale={locale} />
        <main className="max-w-[1200px] mx-auto px-4 py-10 text-center text-gray-400">
          <p>{isKo ? '검색어를 입력해주세요' : 'Please enter a search term'}</p>
        </main>
        <Footer locale={locale} />
      </>
    )
  }

  const supabase = await createClient()

  // 장소 검색
  const { data: places } = await supabase
    .from('places')
    .select('id, name, category, city, district, emoji, rating')
    .or(`name.ilike.%${q}%,address.ilike.%${q}%`)
    .limit(8)

  // 커뮤니티 게시글 검색
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, content, category, city, likes, created_at, user_name')
    .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
    .order('created_at', { ascending: false })
    .limit(8)

  const totalCount = (places?.length ?? 0) + (posts?.length ?? 0)

  return (
    <>
      <Header locale={locale} />
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid grid-cols-[160px_1fr_160px] gap-6">
          <Sidebar position="left" />

          <div className="flex flex-col gap-6 min-w-0">
            {/* 검색 결과 헤더 */}
            <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4">
              <h1 className="text-base font-bold text-gray-800">
                🔍 "{q}" {isKo ? `검색 결과 ${totalCount}건` : `— ${totalCount} results`}
              </h1>
            </div>

            {/* 장소 결과 */}
            {places && places.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-gray-700">
                    📍 {isKo ? `장소 ${places.length}건` : `Places (${places.length})`}
                  </h2>
                  <Link
                    href={`/${locale}/places?q=${q}`}
                    className="text-xs text-sky-500 hover:text-sky-600"
                  >
                    {isKo ? '더보기 →' : 'View all →'}
                  </Link>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {places.map((place) => {
                    const cat = categoryLabel[place.category] ?? categoryLabel.free
                    return (
                      <Link
                        key={place.id}
                        href={`/${locale}/places/${place.id}`}
                        className="bg-white border border-gray-100 rounded-xl p-3 hover:border-sky-200 hover:shadow-sm transition-all"
                      >
                        <div className="text-2xl mb-2 text-center">{place.emoji ?? '📍'}</div>
                        <p className="text-xs font-semibold text-gray-800 truncate text-center">{place.name}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cat.color}`}>
                            {isKo ? cat.ko : cat.en}
                          </span>
                          <span className="text-[10px] text-gray-400">{place.city}</span>
                        </div>
                        {place.rating && (
                          <p className="text-[10px] text-amber-500 text-center mt-1">⭐ {place.rating.toFixed(1)}</p>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* 커뮤니티 결과 */}
            {posts && posts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-gray-700">
                    💬 {isKo ? `커뮤니티 ${posts.length}건` : `Community (${posts.length})`}
                  </h2>
                  <Link
                    href={`/${locale}/community?q=${q}`}
                    className="text-xs text-sky-500 hover:text-sky-600"
                  >
                    {isKo ? '더보기 →' : 'View all →'}
                  </Link>
                </div>
                <div className="flex flex-col gap-2">
                  {posts.map((post) => {
                    const cat = categoryLabel[post.category ?? 'free'] ?? categoryLabel.free
                    return (
                      <Link
                        key={post.id}
                        href={`/${locale}/community/${post.id}`}
                        className="bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-sky-200 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.color}`}>
                            {isKo ? cat.ko : cat.en}
                          </span>
                          <span className="text-[10px] text-gray-400">{post.user_name}</span>
                          {post.city && <span className="text-[10px] text-gray-400">· {post.city}</span>}
                        </div>
                        <p className="text-sm font-medium text-gray-800 truncate">{post.title}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{post.content}</p>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* 결과 없음 */}
            {totalCount === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <span className="text-5xl mb-4">🔍</span>
                <p className="text-base font-medium">
                  {isKo ? `"${q}"에 대한 검색 결과가 없습니다` : `No results for "${q}"`}
                </p>
                <p className="text-sm mt-1">
                  {isKo ? '다른 검색어로 시도해보세요' : 'Try a different search term'}
                </p>
              </div>
            )}
          </div>

          <Sidebar position="right" />
        </div>
      </main>
      <Footer locale={locale} />
    </>
  )
}
