import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useFollow(targetUserId: string | undefined, currentUserId: string | null) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) return
    const supabase = createClient()
    supabase.from('follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .single()
      .then(({ data }) => { if (data) setIsFollowing(true) })
  }, [currentUserId, targetUserId])

  const toggleFollow = async (fromUserName?: string, fromAvatarUrl?: string | null) => {
    if (!currentUserId || !targetUserId || loading) return
    setLoading(true)
    const supabase = createClient()
    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
      setIsFollowing(false)
    } else {
      await supabase.from('follows').insert({
        follower_id: currentUserId,
        following_id: targetUserId,
      })
      setIsFollowing(true)
      if (fromUserName) {
        await fetch(`${window.location.origin}/api/notifications/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: targetUserId,
            type: 'follow',
            post_id: null,
            from_user_name: fromUserName,
            from_avatar_url: fromAvatarUrl ?? null,
            message: `${fromUserName}님이 팔로우했습니다`,
          }),
        })
      }
    }
    setLoading(false)
  }

  return { isFollowing, setIsFollowing, loading, toggleFollow }
}
