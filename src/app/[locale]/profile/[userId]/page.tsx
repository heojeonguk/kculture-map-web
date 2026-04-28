'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Sidebar from '@/components/layout/Sidebar'
import FollowModal from '@/components/mypage/FollowModal'

const levels = [
  { min: 0, max: 0, emoji: '🌱', ko: '새싹 여행자', en: 'Sprout Traveler', lv: 1 },
  { min: 1, max: 9, emoji: '🗺️', ko: '초보 여행자', en: 'Novice Traveler', lv: 2 },
  { min: 10, max: 99, emoji: '✈️', ko: '여행 마니아', en: 'Travel Maniac', lv: 3 },
  { min: 100, max: 499, emoji: '🏆', ko: '여행 전문가', en: 'Travel Expert', lv: 4 },
  { min: 500, max: Infinity, emoji: '👑', ko: '여행 마스터', en: 'Travel Master', lv: 5 },
]

function getLevel(postCount: number, commentCount: number, followerCount: number) {
  if (postCount === 0) return levels[0]
  if (postCount <= 9) return levels[1]
  if (postCount <= 99) return commentCount >= 50 ? levels[2] : levels[1]
  if (postCount <= 499) return commentCount >= 100 ? levels[3] : levels[2]
  return (commentCount >= 100 && followerCount >= 100) ? levels[4] : levels[3]
}

interface Post {
  id: string
  title: string
  category?: string
  city?: string
  likes?: number
  created_at: string
  photo_url?: string
  tags?: string[]
  post_comments?: { count: number }[]
}

interface ProfileData {
  nickname: string | null
  avatar_url: string | null
  posts: Post[]
  followerCount: number
  followingCount: number
  commentCount: number
  photoUrls: { id: string; photo_url: string }[]
}

const categoryLabel: Record<string, { ko: string; en: string; color: string }> = {
  food: { ko: '맛집', en: 'Food', color: 'text-orange-500 bg-orange-50' },
  spot: { ko: '명소', en: 'Spot', color: 'text-blue-500 bg-blue-50' },
  cafe: { ko: '카페', en: 'Cafe', color: 'text-amber-500 bg-amber-50' },
  activity: { ko: '액티비티', en: 'Activity', color: 'text-sky-500 bg-sky-50' },
  free: { ko: '자유', en: 'Free', color: 'text-gray-500 bg-gray-100' },
  review: { ko: '후기', en: 'Review', color: 'text-purple-500 bg-purple-50' },
}

function timeAgo(dateStr: string, isKo: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return isKo ? '방금 전' : 'just now'
  if (mins < 60) return isKo ? `${mins}분 전` : `${mins}m ago`
  if (hours < 24) return isKo ? `${hours}시간 전` : `${hours}h ago`
  return isKo ? `${days}일 전` : `${days}d ago`
}

export default function ProfilePage() {
  const params = useParams()
  const locale = params.locale as string
  const userId = params.userId as string
  const isKo = locale === 'ko'
  const router = useRouter()

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null)
  const [modalPhoto, setModalPhoto] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const [{ data: { user } }, res] = await Promise.all([
        supabase.auth.getUser(),
        fetch(`${window.location.origin}/api/profile/${userId}`),
      ])

      const profileData: ProfileData = await res.json()
      setProfile(profileData)

      if (user) {
        setCurrentUserId(user.id)
        if (user.id !== userId) {
          const { data: follow } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', userId)
            .single()
          if (follow) setIsFollowing(true)
        }
      }
      setLoading(false)
    }
    init()
  }, [userId])

  const handleFollow = async () => {
    if (!currentUserId) { router.push(`/${locale}/auth/login`); return }
    const supabase = createClient()
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', userId)
      setIsFollowing(false)
      setProfile(prev => prev ? { ...prev, followerCount: prev.followerCount - 1 } : prev)
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: userId })
      setIsFollowing(true)
      setProfile(prev => prev ? { ...prev, followerCount: prev.followerCount + 1 } : prev)
      const { data: { user } } = await supabase.auth.getUser()
      const fromUserName = user?.user_metadata?.nickname ?? user?.email?.split('@')[0] ?? '익명'
      await fetch(`${window.location.origin}/api/notifications/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          type: 'follow',
          post_id: null,
          from_user_name: fromUserName,
          from_avatar_url: user?.user_metadata?.avatar_url ?? null,
          message: `${fromUserName}님이 팔로우했습니다`,
        }),
      })
    }
  }

  if (loading) {
    return (
      <>
        <Header locale={locale} />
        <main className="max-w-[1200px] mx-auto px-4 py-6">
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
        <Footer locale={locale} />
      </>
    )
  }

  if (!profile) return null

  const level = getLevel(profile.posts.length, profile.commentCount, profile.followerCount)
  const nickname = profile.nickname ?? (isKo ? '익명' : 'Anonymous')
  const isSelf = currentUserId === userId

  return (
    <>
      <Header locale={locale} />
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid grid-cols-[160px_1fr_160px] gap-6">
          <Sidebar position="left" />
          <div className="flex flex-col gap-5 min-w-0">
            {/* 프로필 카드 */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={nickname} className="w-16 h-16 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center text-2xl font-bold text-sky-600 shrink-0">
                    {nickname.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-gray-900">{nickname}</h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {level.emoji} {isKo ? level.ko : level.en} <span className="text-sky-500 font-bold">Lv.{level.lv}</span>
                  </p>
                </div>
                {isSelf ? (
                  <Link
                    href={`/${locale}/mypage`}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
                  >
                    {isKo ? '마이페이지' : 'My page'}
                  </Link>
                ) : (
                  <button
                    onClick={handleFollow}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 ${
                      isFollowing
                        ? 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                        : 'bg-sky-500 text-white hover:bg-sky-600'
                    }`}
                  >
                    {isFollowing ? (isKo ? '✅ 팔로잉' : '✅ Following') : (isKo ? '➕ 팔로우' : '➕ Follow')}
                  </button>
                )}
              </div>

              {/* 팔로워/팔로잉 */}
              <div className="flex gap-4 text-sm text-gray-500 border-t border-gray-100 pt-3">
                <button
                  onClick={() => setFollowModal('followers')}
                  className="hover:text-sky-500 transition-colors"
                >
                  <span className="font-bold text-gray-800">{profile.followerCount}</span> {isKo ? '팔로워' : 'followers'}
                </button>
                <button
                  onClick={() => setFollowModal('following')}
                  className="hover:text-sky-500 transition-colors"
                >
                  <span className="font-bold text-gray-800">{profile.followingCount}</span> {isKo ? '팔로잉' : 'following'}
                </button>
                <span className="text-gray-300">·</span>
                <span><span className="font-bold text-gray-800">{profile.posts.length}</span> {isKo ? '게시글' : 'posts'}</span>
              </div>
            </div>

            {/* 사진첩 */}
            {profile.photoUrls.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <h2 className="text-base font-bold text-gray-800 mb-3">📸 {isKo ? '사진첩' : 'Photos'}</h2>
                <div className="grid grid-cols-3 gap-2">
                  {profile.photoUrls.map(({ id, photo_url }) => (
                    <Link key={id} href={`/${locale}/community/${id}`}>
                      <img
                        src={photo_url}
                        alt=""
                        className="w-full aspect-square object-cover rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
                        onClick={(e) => { e.preventDefault(); setModalPhoto(photo_url) }}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 게시글 목록 */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <h2 className="text-base font-bold text-gray-800 mb-4">
                📝 {isKo ? `게시글 ${profile.posts.length}개` : `${profile.posts.length} Posts`}
              </h2>
              {profile.posts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">{isKo ? '게시글이 없습니다' : 'No posts yet'}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {profile.posts.map(post => {
                    const cat = categoryLabel[post.category ?? 'free'] ?? categoryLabel.free
                    const commentCount = post.post_comments?.[0]?.count ?? 0
                    return (
                      <Link
                        key={post.id}
                        href={`/${locale}/community/${post.id}`}
                        className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all"
                      >
                        {post.photo_url && (
                          <img src={post.photo_url} alt={post.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.color}`}>
                              {isKo ? cat.ko : cat.en}
                            </span>
                            <span className="text-[10px] text-gray-300 ml-auto">{timeAgo(post.created_at, isKo)}</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-800 truncate">{post.title}</p>
                          <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                            <span>🔥 {post.likes ?? 0}</span>
                            <span>💬 {commentCount}</span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <Sidebar position="right" />
        </div>
      </main>
      <Footer locale={locale} />

      {/* 팔로워/팔로잉 모달 */}
      {followModal && (
        <FollowModal
          userId={userId}
          type={followModal}
          locale={locale}
          onClose={() => setFollowModal(null)}
        />
      )}

      {/* 사진 전체화면 모달 */}
      {modalPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setModalPhoto(null)}
        >
          <button onClick={() => setModalPhoto(null)} className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full bg-black/30">✕</button>
          <img src={modalPhoto} alt="" className="max-w-full max-h-[90vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}
