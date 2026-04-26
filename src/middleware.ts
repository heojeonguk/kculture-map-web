import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// 지원 언어 15개
export const locales = [
  'ko', 'en', 'zh-CN', 'ja', 'zh-TW',
  'th', 'vi', 'id', 'ms', 'es',
  'fr', 'de', 'pt', 'ru', 'ar'
]
export const defaultLocale = 'en'

function getLocale(request: NextRequest): string {
  const acceptLang = request.headers.get('accept-language') || ''
  const preferred = acceptLang.split(',')[0].split(';')[0].trim()

  if (locales.includes(preferred)) return preferred

  // zh 계열 처리
  if (preferred.startsWith('zh-TW') || preferred.startsWith('zh-HK')) return 'zh-TW'
  if (preferred.startsWith('zh')) return 'zh-CN'

  const base = preferred.split('-')[0]
  const match = locales.find(l => l === base)
  return match || defaultLocale
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 이미 locale prefix가 있으면 통과
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // Supabase 세션 갱신
  let response: NextResponse

  if (!pathnameHasLocale) {
    const locale = getLocale(request)
    const newUrl = new URL(`/${locale}${pathname}`, request.url)
    response = NextResponse.redirect(newUrl)
  } else {
    response = NextResponse.next()
  }

  // Supabase 세션 갱신 처리
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/.*|.*\\..*).*)'],
}
