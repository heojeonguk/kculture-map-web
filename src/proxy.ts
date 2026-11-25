import createIntlMiddleware from 'next-intl/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'
import { routing } from './routing'

const intlMiddleware = createIntlMiddleware(routing)

/**
 * 로그인이 필요한 경로. 이 경로에서만 Supabase 세션을 갱신한다.
 * locale 접두사(/ko, /en …)가 붙은 형태와 붙지 않은 형태 모두 매칭한다.
 */
const PROTECTED_PATHS = [
  '/mypage',
  '/messages',
  '/community/write',
  '/community/edit',
  '/ai-recommend',
  '/places/request',
]

const LOCALE_PREFIX = new RegExp(`^/(?:${routing.locales.join('|')})(?=/|$)`)

function needsSession(pathname: string): boolean {
  const path = pathname.replace(LOCALE_PREFIX, '') || '/'
  return PROTECTED_PATHS.some(p => path === p || path.startsWith(`${p}/`))
}

export async function proxy(request: NextRequest) {
  // next-intl이 locale 감지 및 리다이렉트 처리
  const response = intlMiddleware(request)

  // 공개 경로에서는 Supabase를 호출하지 않는다.
  // 모든 요청마다 getUser()를 돌리면 봇 트래픽이 그대로 서버 CPU가 된다.
  if (!needsSession(request.nextUrl.pathname)) {
    return response
  }

  // Supabase 세션 갱신 — intlMiddleware가 만든 response에 쿠키를 덧씌움
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
  matcher: [
    /*
     * 다음을 제외한 모든 경로에서 실행:
     * - api 라우트
     * - _next/static, _next/image (정적 파일 / 이미지 최적화)
     * - favicon.ico, sitemap.xml, robots.txt (메타데이터 파일)
     * - 이미지 확장자 (png|jpg|jpeg|gif|webp|svg|ico)
     * - 그 외 확장자가 붙은 모든 정적 파일 요청
     */
    '/((?!api/|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$|.*\\..*).*)',
  ],
}
