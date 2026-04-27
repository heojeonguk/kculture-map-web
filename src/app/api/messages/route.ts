import { createClient } from '@/lib/supabase/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const senderId = searchParams.get('sender_id')
  const receiverId = searchParams.get('receiver_id')

  if (!senderId || !receiverId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
    )
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: data })
}

export async function POST(request: NextRequest) {
  const { sender_id, receiver_id, content, sender_name, receiver_name } = await request.json()

  if (!sender_id || !receiver_id || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id,
      receiver_id,
      content,
      sender_name,
      receiver_name,
      is_read: false,
      topic: 'direct',
      extension: 'dm',
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: data })
}
