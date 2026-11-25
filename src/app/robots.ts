import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/seo'

/**
 * 전면 차단 봇.
 * SEO 분석/AI 학습 크롤러로, 수만 개 장소 페이지를 반복 크롤링해
 * 서버 CPU만 소모하고 유입은 만들지 않는다.
 */
const BLOCKED_BOTS = [
  'AhrefsBot',
  'SemrushBot',
  'MJ12bot',
  'DotBot',
  'PetalBot',
  'Bytespider',
  'GPTBot',
  'CCBot',
  'ClaudeBot',
  'anthropic-ai',
  'Amazonbot',
  'meta-externalagent',
  'DataForSeoBot',
  'BLEXBot',
  'Barkrowler',
]

/** 검색 유입을 받을 봇 — 허용한다. */
const ALLOWED_BOTS = ['Googlebot', 'Bingbot', 'Yeti']

/**
 * 모든 봇 공통 차단 경로.
 * 쿼리 파라미터 조합은 사실상 무한히 늘어나므로 색인 대상에서 제외한다.
 */
const COMMON_DISALLOW = [
  // 비공개 / 기능 경로
  '/api/',
  '/*/mypage',
  '/*/messages',
  '/*/auth/',
  // 쿼리 파라미터 조합 (무한 URL 방지)
  '/*?page=',
  '/*?category=',
  '/*?city=',
  '/*?q=',
  // 검색 결과 페이지
  '/search',
  '/*/search',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: COMMON_DISALLOW,
      },
      {
        userAgent: ALLOWED_BOTS,
        allow: '/',
        disallow: COMMON_DISALLOW,
      },
      {
        userAgent: BLOCKED_BOTS,
        disallow: '/',
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
