import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const supabase = await createClient()

    const [
      { data: posts },
      { count: followerCount },
      { count: followingCount },
      { count: commentCount },
      { data: nicknameData },
    ] = await Promise.all([
      supabase
        .from('posts')
        .select('id, title, category, city, likes, created_at, photo_url, avatar_url, user_name, tags, post_comments(count)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
      supabase.from('post_comments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('nicknames').select('nickname').eq('user_id', userId).single(),
    ])

    const avatar_url = posts?.find(p => p.avatar_url)?.avatar_url ?? null
    const nickname = nicknameData?.nickname ?? posts?.[0]?.user_name ?? null
    const photoUrls = (posts ?? [])
      .filter(p => p.photo_url)
      .map(p => ({ id: p.id, photo_url: p.photo_url }))

    return NextResponse.json({
      nickname,
      avatar_url,
      posts: posts ?? [],
      followerCount: followerCount ?? 0,
      followingCount: followingCount ?? 0,
      commentCount: commentCount ?? 0,
      photoUrls,
    })
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json({ nickname: null, avatar_url: null, posts: [], followerCount: 0, followingCount: 0, commentCount: 0, photoUrls: [] })
  }
}
