import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './routing'
import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'

const intlMiddleware = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  // next-intl이 locale 감지 및 리다이렉트 처리
  const response = intlMiddleware(request)

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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/.*|.*\\..*).*)'],
}
