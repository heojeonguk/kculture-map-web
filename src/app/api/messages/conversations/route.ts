import { createClient } from '@/lib/supabase/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) return NextResponse.json({ conversations: [] })

  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const map = new Map<string, {
    other_user_id: string
    other_user_name: string
    last_message: string
    last_message_at: string
    unread_count: number
  }>()

  for (const msg of data ?? []) {
    const isReceiver = msg.receiver_id === userId
    const otherId = isReceiver ? msg.sender_id : msg.receiver_id
    const otherName = isReceiver ? msg.sender_name : msg.receiver_name

    if (!map.has(otherId)) {
      map.set(otherId, {
        other_user_id: otherId,
        other_user_name: otherName ?? otherId,
        last_message: msg.content,
        last_message_at: msg.created_at,
        unread_count: isReceiver && !msg.is_read ? 1 : 0,
      })
    } else {
      const conv = map.get(otherId)!
      if (isReceiver && !msg.is_read) conv.unread_count += 1
    }
  }

  return NextResponse.json({ conversations: Array.from(map.values()) })
}
