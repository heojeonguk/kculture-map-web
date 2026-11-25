import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * 쿠키를 읽지 않는 공개 데이터 전용 Supabase 클라이언트.
 *
 * `@/lib/supabase/server`의 클라이언트는 `cookies()`를 읽기 때문에
 * 이를 사용하는 페이지는 전부 요청마다 동적 렌더링된다(= 서버 CPU 폭증).
 * 로그인 상태가 필요 없는 공개 조회는 이 클라이언트를 쓰면
 * 페이지가 ISR로 캐시될 수 있다.
 *
 * 사용자별 정보(로그인 여부, 북마크, 좋아요)는 client component에서
 * `@/lib/supabase/client` + `useCurrentUser`로 따로 불러온다.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
}
