import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')
    const type = url.searchParams.get('type') // 'followers' | 'following'

    if (!userId || !type) return NextResponse.json([])

    const supabase = await createClient()

    const filterCol = type === 'followers' ? 'following_id' : 'follower_id'
    const targetCol = type === 'followers' ? 'follower_id' : 'following_id'

    const { data: follows } = await supabase
      .from('follows')
      .select(targetCol)
      .eq(filterCol, userId)

    if (!follows || follows.length === 0) return NextResponse.json([])

    const userIds = follows.map(f => (f as Record<string, string>)[targetCol])

    const [{ data: nicknames }, { data: avatarPosts }] = await Promise.all([
      supabase.from('nicknames').select('user_id, nickname').in('user_id', userIds),
      supabase.from('posts')
        .select('user_id, avatar_url, user_name')
        .in('user_id', userIds)
        .not('avatar_url', 'is', null)
        .order('created_at', { ascending: false }),
    ])

    const result = userIds.map(uid => {
      const n = nicknames?.find(x => x.user_id === uid)
      const p = avatarPosts?.find(x => x.user_id === uid)
      return {
        user_id: uid,
        nickname: n?.nickname ?? p?.user_name ?? '익명',
        avatar_url: p?.avatar_url ?? null,
      }
    })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json([])
  }
}
