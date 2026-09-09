import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  ADMIN_USER_ID,
  CATEGORY_EMOJI,
  RequestCategory,
  PlaceRequestRow,
} from '@/lib/placeRequest'

// POST: 요청 승인 → places INSERT + status를 'approved'로 변경
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()

  const { data: req, error: fetchError } = await admin
    .from('place_requests')
    .select('*')
    .eq('id', id)
    .single<PlaceRequestRow>()

  if (fetchError || !req) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  if (req.status !== 'pending') {
    return NextResponse.json(
      { error: `이미 처리된 요청입니다 (status=${req.status})` },
      { status: 409 }
    )
  }

  const { data: place, error: placeError } = await admin
    .from('places')
    .insert({
      name: req.name,
      name_en: req.name_en,
      category: req.category,
      city: req.city,
      address: req.address,
      hours: req.hours,
      // photo_urls[0]을 대표 사진으로 사용
      photo_url: req.photo_urls?.[0] ?? null,
      emoji: CATEGORY_EMOJI[req.category as RequestCategory] ?? '📍',
    })
    .select('id')
    .single()

  if (placeError) {
    console.error('places insert 실패:', placeError.message)
    return NextResponse.json({ error: 'Failed to create place' }, { status: 500 })
  }

  const { error: updateError } = await admin
    .from('place_requests')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    // places는 이미 만들어졌으므로 되돌려서 중복 생성을 막는다
    await admin.from('places').delete().eq('id', place.id)
    console.error('place_requests 상태 변경 실패:', updateError.message)
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
  }

  return NextResponse.json({ place_id: place.id, status: 'approved' })
}
