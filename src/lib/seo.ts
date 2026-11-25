import type { Metadata } from 'next'

export const BASE_URL = 'https://www.kculture-map.com'

/** routing.ts와 동일한 15개 locale */
export const SEO_LOCALES = [
  'ko', 'en', 'zh-CN', 'ja', 'zh-TW',
  'th', 'vi', 'id', 'ms', 'es',
  'fr', 'de', 'pt', 'ru', 'ar',
] as const

/** hreflang에 쓰는 BCP-47 코드. locale 코드와 다른 것만 매핑한다. */
const HREFLANG: Record<string, string> = {
  'zh-CN': 'zh-Hans',
  'zh-TW': 'zh-Hant',
}

function hreflangOf(locale: string) {
  return HREFLANG[locale] ?? locale
}

/**
 * locale별 URL 15개 + x-default(en)를 만든다.
 * @param path locale 뒤에 붙는 경로. 홈은 ''. 예: '/places', `/places/${id}`
 */
export function localeAlternates(path = ''): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const locale of SEO_LOCALES) {
    languages[hreflangOf(locale)] = `${BASE_URL}/${locale}${path}`
  }
  languages['x-default'] = `${BASE_URL}/en${path}`
  return languages
}

/**
 * canonical(쿼리 파라미터 제외) + hreflang 15개 + x-default.
 */
export function alternatesFor(locale: string, path = ''): Metadata['alternates'] {
  return {
    canonical: `${BASE_URL}/${locale}${path}`,
    languages: localeAlternates(path),
  }
}
