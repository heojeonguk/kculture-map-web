import type { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/public'
import { BASE_URL, SEO_LOCALES, localeAlternates } from '@/lib/seo'

// 24시간 ISR — 봇이 sitemap을 요청할 때마다 DB를 조회하지 않게 한다.
export const revalidate = 86400

const STATIC_PATHS: {
  path: string
  changeFrequency: 'daily' | 'weekly'
  priority: number
}[] = [
  { path: '', changeFrequency: 'daily', priority: 1.0 },
  { path: '/places', changeFrequency: 'daily', priority: 0.9 },
  { path: '/community', changeFrequency: 'daily', priority: 0.8 },
  { path: '/ai-recommend', changeFrequency: 'weekly', priority: 0.7 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient()

  // 정적 페이지 — 15개 언어별 URL + 각 URL에 hreflang 15개 연결
  const staticPages: MetadataRoute.Sitemap = STATIC_PATHS.flatMap(
    ({ path, changeFrequency, priority }) =>
      SEO_LOCALES.map(locale => ({
        url: `${BASE_URL}/${locale}${path}`,
        changeFrequency,
        priority,
        alternates: { languages: localeAlternates(path) },
      }))
  )

  // 동적 장소 페이지 — 사진이 있는 장소만 색인 대상으로 삼는다.
  // (사진 없는 페이지는 색인 가치가 낮고 크롤 예산만 소모한다)
  const { data: places } = await supabase
    .from('places')
    .select('id, created_at')
    .not('photo_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1000)

  const placeUrls: MetadataRoute.Sitemap = (places ?? []).map(place => ({
    url: `${BASE_URL}/en/places/${place.id}`,
    lastModified: place.created_at,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
    alternates: { languages: localeAlternates(`/places/${place.id}`) },
  }))

  return [...staticPages, ...placeUrls]
}
