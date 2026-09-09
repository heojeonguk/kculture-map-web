import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  ADMIN_USER_ID,
  REQUEST_STATUSES,
  validatePlaceRequest,
} from '@/lib/placeRequest'

// POST: 장소 등록 요청 생성 (비로그인 사용자도 가능)
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = validatePlaceRequest(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  // 로그인 상태면 user_id를 세션에서 채운다 (요청 본문의 값은 신뢰하지 않음)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // place_requests는 RLS가 anon INSERT를 막고 있어 service_role로 넣는다
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('place_requests')
    .insert({ ...parsed.value, user_id: user?.id ?? null, status: 'pending' })
    .select('id')
    .single()

  if (error) {
    console.error('place_requests insert 실패:', error.message)
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}

// GET: 관리자용 요청 목록 (status 쿼리 파라미터로 필터)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const status = request.nextUrl.searchParams.get('status')
  if (status && !(REQUEST_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 })
  }

  const admin = createAdminClient()
  let query = admin
    .from('place_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) {
    console.error('place_requests 조회 실패:', error.message)
    return NextResponse.json({ error: 'Failed to load requests' }, { status: 500 })
  }

  return NextResponse.json(data)
}
