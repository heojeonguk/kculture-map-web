import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * service_role 키를 쓰는 서버 전용 Supabase 클라이언트.
 *
 * RLS를 우회하므로 서버(Route Handler / Server Component)에서만 사용할 것.
 * 클라이언트 번들에 들어가면 키가 유출된다.
 *
 * place_requests / places 테이블은 RLS가 anon INSERT를 막고 있어서
 * (비로그인 사용자의 장소 등록 요청, 승인 시 places 생성) 이 클라이언트가 필요하다.
 * RLS가 막아주지 않는 만큼 호출부에서 입력 검증과 권한 확인을 반드시 해야 한다.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다')
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
