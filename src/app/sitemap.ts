import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = 'https://www.kculture-map.com'

const locales = [
  'ko', 'en', 'zh-CN', 'ja', 'zh-TW',
  'th', 'vi', 'id', 'ms', 'es',
  'fr', 'de', 'pt', 'ru', 'ar',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // 정적 페이지 — 15개 언어별
  const staticPages: MetadataRoute.Sitemap = locales.flatMap(locale => [
    { url: `${BASE_URL}/${locale}`,              changeFrequency: 'daily',  priority: 1.0 },
    { url: `${BASE_URL}/${locale}/places`,        changeFrequency: 'daily',  priority: 0.9 },
    { url: `${BASE_URL}/${locale}/community`,     changeFrequency: 'daily',  priority: 0.8 },
    { url: `${BASE_URL}/${locale}/ai-recommend`,  changeFrequency: 'weekly', priority: 0.7 },
  ])

  // 동적 장소 페이지 (en 로케일, 최신순 1000개)
  const { data: places } = await supabase
    .from('places')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(1000)

  const placeUrls: MetadataRoute.Sitemap = (places ?? []).map(place => ({
    url: `${BASE_URL}/en/places/${place.id}`,
    lastModified: place.created_at,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...placeUrls]
}
