'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('mypage')
  const router = useRouter()
  const [users, setUsers] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())

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
    if (followingIds.has(targetId)) {
      await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', targetId)
      setFollowingIds(prev => { const s = new Set(prev); s.delete(targetId); return s })
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: targetId })
      setFollowingIds(prev => new Set([...prev, targetId]))
    }
  }

  const goTo = (path: string) => { onClose(); router.push(path) }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-bold text-gray-800">
            {type === 'followers' ? t('followers') : t('following')}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            ✕
          </button>
        </div>

        {/* 목록 */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <span className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">{t('noneYet')}</p>
          ) : (
            users.map(u => {
              const isMe = currentUserId === u.user_id
              const isFollowing = followingIds.has(u.user_id)

              return (
                <div key={u.user_id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                  {/* 아바타 */}
                  {u.avatar_url ? (
                    <img
                      src={u.avatar_url}
                      alt={u.nickname}
                      className="w-10 h-10 rounded-full object-cover shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => goTo(`/${locale}/profile/${u.user_id}`)}
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sm font-bold text-sky-600 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => goTo(`/${locale}/profile/${u.user_id}`)}
                    >
                      {u.nickname.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* 닉네임 */}
                  <button
                    onClick={() => goTo(`/${locale}/profile/${u.user_id}`)}
                    className="flex-1 text-sm font-medium text-gray-700 text-left hover:text-sky-500 transition-colors truncate"
                  >
                    {u.nickname}
                  </button>

                  {/* 액션 버튼들 */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* 프로필 보기 */}
                    <button
                      onClick={() => goTo(`/${locale}/profile/${u.user_id}`)}
                      title={t('viewProfile')}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-sky-500 hover:bg-sky-50 transition-colors text-base"
                    >
                      👤
                    </button>

                    {/* 메시지 — 본인 제외 */}
                    {!isMe && (
                      <button
                        onClick={() => goTo(`/${locale}/messages/${u.user_id}`)}
                        title={t('sendMessage')}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-sky-500 hover:bg-sky-50 transition-colors text-base"
                      >
                        ✉️
                      </button>
                    )}

                    {/* 팔로우 — 본인 제외, 로그인 필요 */}
                    {!isMe && currentUserId && (
                      <button
                        onClick={() => handleFollow(u.user_id)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          isFollowing
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-sky-500 text-white hover:bg-sky-600'
                        }`}
                      >
                        {isFollowing ? t('following') : t('follow')}
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
