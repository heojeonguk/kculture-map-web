'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Photo {
  id: string
  user_id: string
  photo_url: string
  likes_count?: number
  nickname?: string
  avatar_url?: string
  user_level_emoji?: string
}

interface BestPhotosProps {
  photos: Photo[]
  locale: string
}

export default function BestPhotos({ photos, locale }: BestPhotosProps) {
  const isKo = locale === 'ko'
  const router = useRouter()
  const [modalPhoto, setModalPhoto] = useState<Photo | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [photosState, setPhotosState] = useState<Photo[]>(photos)
  const [isFollowing, setIsFollowing] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleOpen = async (photo: Photo) => {
    setModalPhoto(photo)
    setShowDropdown(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      const { data: liked } = await supabase
        .from('photo_likes').select('photo_id').eq('user_id', user.id)
      if (liked) setLikedIds(new Set(liked.map(l => l.photo_id)))
      if (photo.user_id && user.id !== photo.user_id) {
        const { data: follow } = await supabase
          .from('follows').select('id')
          .eq('follower_id', user.id).eq('following_id', photo.user_id).single()
        setIsFollowing(!!follow)
      }
    }
  }

  const handleLike = async (photoId: string) => {
    if (!currentUserId) return
    const supabase = createClient()
    const isLiked = likedIds.has(photoId)
    const photo = photosState.find(p => p.id === photoId)
    if (isLiked) {
      await supabase.from('photo_likes').delete().eq('photo_id', photoId).eq('user_id', currentUserId)
      await supabase.from('user_photos').update({ likes_count: (photo?.likes_count ?? 1) - 1 }).eq('id', photoId)
      setLikedIds(prev => { const s = new Set(prev); s.delete(photoId); return s })
      setPhotosState(prev => prev.map(p => p.id === photoId ? { ...p, likes_count: (p.likes_count ?? 1) - 1 } : p))
      if (modalPhoto?.id === photoId) setModalPhoto(prev => prev ? { ...prev, likes_count: (prev.likes_count ?? 1) - 1 } : null)
    } else {
      await supabase.from('photo_likes').insert({ photo_id: photoId, user_id: currentUserId })
      await supabase.from('user_photos').update({ likes_count: (photo?.likes_count ?? 0) + 1 }).eq('id', photoId)
      setLikedIds(prev => new Set([...prev, photoId]))
      setPhotosState(prev => prev.map(p => p.id === photoId ? { ...p, likes_count: (p.likes_count ?? 0) + 1 } : p))
      if (modalPhoto?.id === photoId) setModalPhoto(prev => prev ? { ...prev, likes_count: (prev.likes_count ?? 0) + 1 } : null)
    }
  }

  const handleFollow = async () => {
    if (!currentUserId || !modalPhoto?.user_id) return
    const supabase = createClient()
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', modalPhoto.user_id)
      setIsFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: modalPhoto.user_id })
      setIsFollowing(true)
      const { data: { user } } = await supabase.auth.getUser()
      const fromUserName = user?.user_metadata?.nickname ?? user?.email?.split('@')[0] ?? '익명'
      await fetch(`${window.location.origin}/api/notifications/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: modalPhoto.user_id,
          type: 'follow',
          post_id: null,
          from_user_name: fromUserName,
          message: `${fromUserName}님이 팔로우했습니다`,
        }),
      })
    }
    setShowDropdown(false)
  }

  return (
    <section>
      <h2 className="text-base font-bold text-gray-800 mb-3">
        📸 {isKo ? '베스트 사진' : 'Best Photos'}
      </h2>

      {photosState.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          {isKo ? '사진이 없습니다' : 'No photos yet'}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photosState.map(photo => (
            <div
              key={photo.id}
              className="relative aspect-square cursor-pointer group"
              onClick={() => handleOpen(photo)}
            >
              <img
                src={photo.photo_url}
                alt=""
                className="w-full h-full object-cover rounded-xl hover:opacity-90 transition-opacity"
              />
              <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                🔥 {photo.likes_count ?? 0}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 사진 모달 */}
      {modalPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => { setModalPhoto(null); setShowDropdown(false) }}
        >
          <button
            onClick={() => setModalPhoto(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full bg-black/30"
          >✕</button>

          <div
            className="flex flex-col items-center gap-4 max-w-2xl w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* 사진 */}
            <img
              src={modalPhoto.photo_url}
              alt=""
              className="max-w-full max-h-[65vh] object-contain rounded-lg"
            />

            {/* 작성자 정보 + 좋아요 */}
            <div className="flex items-center justify-between w-full px-2">
              {/* 작성자 */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(prev => !prev)}
                  className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
                >
                  {modalPhoto.avatar_url ? (
                    <img src={modalPhoto.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-sm font-bold text-white">
                      {(modalPhoto.nickname ?? 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    {modalPhoto.user_level_emoji && <span className="text-sm">{modalPhoto.user_level_emoji}</span>}
                    <span className="text-sm font-medium">{modalPhoto.nickname ?? (isKo ? '익명' : 'Anonymous')}</span>
                  </div>
                </button>

                {/* 드롭다운 */}
                {showDropdown && (
                  <div
                    className="absolute left-0 bottom-10 bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[160px]"
                    style={{ zIndex: 9999 }}
                  >
                    <button
                      onClick={() => { setShowDropdown(false); setModalPhoto(null); router.push(`/${locale}/profile/${modalPhoto.user_id}`) }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      👤 {isKo ? '프로필 보기' : 'View profile'}
                    </button>
                    {currentUserId && currentUserId !== modalPhoto.user_id && (
                      <>
                        <button
                          onClick={() => { setShowDropdown(false); setModalPhoto(null); router.push(`/${locale}/messages/${modalPhoto.user_id}`) }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600 flex items-center gap-2"
                        >
                          ✉️ {isKo ? '메시지 보내기' : 'Send message'}
                        </button>
                        <button
                          onClick={handleFollow}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600 flex items-center gap-2"
                        >
                          {isFollowing ? '✅' : '➕'} {isFollowing ? (isKo ? '팔로잉' : 'Following') : (isKo ? '팔로우' : 'Follow')}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 좋아요 */}
              <button
                onClick={() => handleLike(modalPhoto.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  likedIds.has(modalPhoto.id)
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                } ${!currentUserId ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                🔥 {modalPhoto.likes_count ?? 0}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
