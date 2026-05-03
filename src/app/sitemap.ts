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

  // 동적 장소 페이지
  const { data: places } = await supabase
    .from('places')
    .select('id, updated_at')

  const placeUrls: MetadataRoute.Sitemap = (places ?? []).flatMap(place =>
    locales.map(locale => ({
      url: `${BASE_URL}/${locale}/places/${place.id}`,
      lastModified: place.updated_at ? new Date(place.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  )

  // 동적 게시글 페이지 (최근 500개)
  const { data: posts } = await supabase
    .from('posts')
    .select('id, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(500)

  const postUrls: MetadataRoute.Sitemap = (posts ?? []).flatMap(post =>
    locales.map(locale => ({
      url: `${BASE_URL}/${locale}/community/${post.id}`,
      lastModified: post.updated_at
        ? new Date(post.updated_at)
        : new Date(post.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  )

  return [...staticPages, ...placeUrls, ...postUrls]
}
