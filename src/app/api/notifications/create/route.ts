import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { user_id, type, post_id, from_user_name, from_avatar_url, message } = await request.json()

  if (!user_id || !type || !post_id || !message) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .insert({ user_id, type, post_id, from_user_name, from_avatar_url, message })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
