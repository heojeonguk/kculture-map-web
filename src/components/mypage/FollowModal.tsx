'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface FollowUser {
  user_id: string
  nickname: string
  avatar_url: string | null
}

interface FollowModalProps {
  userId: string
  type: 'followers' | 'following'
  locale: string
  onClose: () => void
}

export default function FollowModal({ userId, type, locale, onClose }: FollowModalProps) {
  const isKo = locale === 'ko'
  const router = useRouter()
  const [users, setUsers] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        const { data: myFollows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
        if (myFollows) setFollowingIds(new Set(myFollows.map(f => f.following_id)))
      }

      const res = await fetch(`${window.location.origin}/api/follows?user_id=${userId}&type=${type}`)
      const data = await res.json()
      setUsers(data)
      setLoading(false)
    }
    init()
  }, [userId, type])

  const handleFollow = async (targetId: string) => {
    if (!currentUserId) return
    const supabase = createClient()
    const isNowFollowing = followingIds.has(targetId)
    if (isNowFollowing) {
      await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', targetId)
      setFollowingIds(prev => { const s = new Set(prev); s.delete(targetId); return s })
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: targetId })
      setFollowingIds(prev => new Set([...prev, targetId]))
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full min-w-[320px] max-w-sm max-h-[500px] flex flex-col overflow-hidden shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">
            {type === 'followers' ? (isKo ? '팔로워' : 'Followers') : (isKo ? '팔로잉' : 'Following')}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <span className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-10">
              {isKo ? '없습니다' : 'None yet'}
            </p>
          ) : (
            users.map(u => (
              <div key={u.user_id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt={u.nickname} className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sm font-bold text-sky-600 shrink-0">
                    {u.nickname.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => { onClose(); router.push(`/${locale}/profile/${u.user_id}`) }}
                  className="flex-1 text-sm font-medium text-gray-700 text-left hover:text-sky-500 transition-colors truncate"
                >
                  {u.nickname}
                </button>
                <div className="relative shrink-0">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === u.user_id ? null : u.user_id)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ···
                  </button>
                  {activeDropdown === u.user_id && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden min-w-[150px]">
                      <button
                        onClick={() => { setActiveDropdown(null); onClose(); router.push(`/${locale}/profile/${u.user_id}`) }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        👤 {isKo ? '프로필 보기' : 'View profile'}
                      </button>
                      {currentUserId && currentUserId !== u.user_id && (
                        <>
                          <button
                            onClick={() => { setActiveDropdown(null); onClose(); router.push(`/${locale}/messages/${u.user_id}`) }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600 flex items-center gap-2"
                          >
                            ✉️ {isKo ? '메시지 보내기' : 'Send message'}
                          </button>
                          <button
                            onClick={() => { handleFollow(u.user_id); setActiveDropdown(null) }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600 flex items-center gap-2"
                          >
                            {followingIds.has(u.user_id) ? '✅' : '➕'} {followingIds.has(u.user_id) ? (isKo ? '팔로잉' : 'Following') : (isKo ? '팔로우' : 'Follow')}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
