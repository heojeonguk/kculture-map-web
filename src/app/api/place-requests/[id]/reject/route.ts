import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ADMIN_USER_ID, PlaceRequestRow } from '@/lib/placeRequest'

// POST: 요청 거절 → status를 'rejected'로 변경 (places에는 아무것도 만들지 않음)
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

  let adminNote: string | null = null
  try {
    const body = await request.json()
    if (body && typeof body.admin_note === 'string') {
      adminNote = body.admin_note.trim().slice(0, 500) || null
    }
  } catch {
    // 본문 없이 호출해도 된다
  }

  const admin = createAdminClient()

  const { data: req, error: fetchError } = await admin
    .from('place_requests')
    .select('status')
    .eq('id', id)
    .single<Pick<PlaceRequestRow, 'status'>>()

  if (fetchError || !req) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  if (req.status !== 'pending') {
    return NextResponse.json(
      { error: `이미 처리된 요청입니다 (status=${req.status})` },
      { status: 409 }
    )
  }

  const { error } = await admin
    .from('place_requests')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      ...(adminNote ? { admin_note: adminNote } : {}),
    })
    .eq('id', id)

  if (error) {
    console.error('place_requests 거절 실패:', error.message)
    return NextResponse.json({ error: 'Failed to reject request' }, { status: 500 })
  }

  return NextResponse.json({ status: 'rejected' })
}
