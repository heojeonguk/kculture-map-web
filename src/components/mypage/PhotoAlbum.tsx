'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Photo {
  id: string
  user_id: string
  photo_url: string
  likes_count?: number
  created_at: string
}

interface PhotoAlbumProps {
  userId: string
  isOwner: boolean
  locale: string
}

export default function PhotoAlbum({ userId, isOwner, locale }: PhotoAlbumProps) {
  const isKo = locale === 'ko'
  const router = useRouter()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [modalPhoto, setModalPhoto] = useState<Photo | null>(null)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const [{ data: photosData }, { data: { user } }] = await Promise.all([
        supabase.from('user_photos').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.auth.getUser(),
      ])
      setPhotos(photosData ?? [])
      if (user) {
        setCurrentUserId(user.id)
        const { data: liked } = await supabase
          .from('photo_likes')
          .select('photo_id')
          .eq('user_id', user.id)
        if (liked) setLikedIds(new Set(liked.map(l => l.photo_id)))
      }
      setLoading(false)
    }
    init()
  }, [userId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `albums/${userId}_${Date.now()}.${ext}`
    const { data: storageData, error: storageError } = await supabase.storage
      .from('community-photos')
      .upload(path, file)
    if (storageError || !storageData) { setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('community-photos').getPublicUrl(path)
    const { data: newPhoto } = await supabase
      .from('user_photos')
      .insert({ user_id: userId, photo_url: publicUrl })
      .select('*')
      .single()
    if (newPhoto) setPhotos(prev => [newPhoto, ...prev])
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDelete = async (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm(isKo ? '이 사진을 삭제하시겠습니까?' : 'Delete this photo?')) return
    const supabase = createClient()
    await supabase.from('user_photos').delete().eq('id', photoId)
    setPhotos(prev => prev.filter(p => p.id !== photoId))
    if (modalPhoto?.id === photoId) setModalPhoto(null)
  }

  const handleLike = async (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentUserId) return
    const supabase = createClient()
    const isLiked = likedIds.has(photoId)
    if (isLiked) {
      await supabase.from('photo_likes').delete().eq('photo_id', photoId).eq('user_id', currentUserId)
      await supabase.from('user_photos').update({ likes_count: (photos.find(p => p.id === photoId)?.likes_count ?? 1) - 1 }).eq('id', photoId)
      setLikedIds(prev => { const s = new Set(prev); s.delete(photoId); return s })
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, likes_count: (p.likes_count ?? 1) - 1 } : p))
      if (modalPhoto?.id === photoId) setModalPhoto(prev => prev ? { ...prev, likes_count: (prev.likes_count ?? 1) - 1 } : null)
    } else {
      await supabase.from('photo_likes').insert({ photo_id: photoId, user_id: currentUserId })
      await supabase.from('user_photos').update({ likes_count: (photos.find(p => p.id === photoId)?.likes_count ?? 0) + 1 }).eq('id', photoId)
      setLikedIds(prev => new Set([...prev, photoId]))
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, likes_count: (p.likes_count ?? 0) + 1 } : p))
      if (modalPhoto?.id === photoId) setModalPhoto(prev => prev ? { ...prev, likes_count: (prev.likes_count ?? 0) + 1 } : null)
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-800">
          📸 {isKo ? '사진첩' : 'Photos'}
        </h2>
        {isOwner && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1 text-xs text-sky-500 hover:text-sky-600 border border-sky-200 hover:border-sky-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <span className="w-3 h-3 border border-sky-400 border-t-transparent rounded-full animate-spin" />
              ) : '📷'}
              {isKo ? '사진 추가' : 'Add photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          {isKo ? '아직 사진이 없습니다' : 'No photos yet'}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(photo => (
            <div
              key={photo.id}
              className="relative aspect-square group cursor-pointer"
              onClick={() => setModalPhoto(photo)}
            >
              <img
                src={photo.photo_url}
                alt=""
                className="w-full h-full object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-end justify-between p-2 pointer-events-none">
                <div className="pointer-events-auto flex flex-col items-end gap-1">
                  {isOwner && (
                    <button
                      onClick={(e) => handleDelete(photo.id, e)}
                      className="bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-500 transition-colors"
                    >✕</button>
                  )}
                </div>
                <button
                  onClick={(e) => handleLike(photo.id, e)}
                  className={`pointer-events-auto flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                    likedIds.has(photo.id) ? 'bg-orange-500 text-white' : 'bg-black/50 text-white'
                  } ${!currentUserId ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  🔥 {photo.likes_count ?? 0}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 사진 모달 */}
      {modalPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setModalPhoto(null)}
        >
          <button
            onClick={() => setModalPhoto(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full bg-black/30"
          >✕</button>
          <div
            className="flex flex-col items-center gap-3 max-w-2xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={modalPhoto.photo_url}
              alt=""
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
            />
            {/* 좋아요 버튼 */}
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => handleLike(modalPhoto.id, e)}
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
    </div>
  )
}
