'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Post {
  id: string
  title: string
  content: string
  user_id?: string
  category?: string
  city?: string
  likes?: number
  created_at: string
  user_name?: string
  nation?: string
  avatar_url?: string
  photo_url?: string
  user_level_emoji?: string
}

interface PostDetailProps {
  post: Post
  locale: string
}

const categoryLabel: Record<string, { ko: string; en: string; color: string }> = {
  food: { ko: '맛집', en: 'Food', color: 'text-orange-500 bg-orange-50' },
  spot: { ko: '명소', en: 'Spot', color: 'text-blue-500 bg-blue-50' },
  cafe: { ko: '카페', en: 'Cafe', color: 'text-amber-500 bg-amber-50' },
  activity: { ko: '액티비티', en: 'Activity', color: 'text-sky-500 bg-sky-50' },
  free: { ko: '자유', en: 'Free', color: 'text-gray-500 bg-gray-100' },
  review: { ko: '후기', en: 'Review', color: 'text-purple-500 bg-purple-50' },
}

export default function PostDetail({ post, locale }: PostDetailProps) {
  const isKo = locale === 'ko'
  const router = useRouter()
  const cat = categoryLabel[post.category ?? 'free'] ?? categoryLabel.free
  const date = new Date(post.created_at).toLocaleDateString(
    isKo ? 'ko-KR' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [likes, setLikes] = useState(post.likes ?? 0)
  const [liked, setLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [modalSrc, setModalSrc] = useState<string | null>(null)
  const [translated, setTranslated] = useState<string | null>(null)
  const [translating, setTranslating] = useState(false)
  const [showTranslated, setShowTranslated] = useState(false)

  useEffect(() => {
    const checkLiked = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
      const identifier = user?.id ?? localStorage.getItem('anon_id') ?? ''
      if (!identifier) return
      const { data } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_identifier', identifier)
        .single()
      if (data) setLiked(true)
    }
    checkLiked()
  }, [post.id])

  const handleTranslate = async () => {
    if (translated) {
      setShowTranslated(!showTranslated)
      return
    }
    setTranslating(true)
    try {
      const response = await fetch(`${window.location.origin}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: post.content, targetLocale: locale }),
      })
      const data = await response.json()
      setTranslated(data.translated)
      setShowTranslated(true)
    } catch {
      // 에러 무시
    }
    setTranslating(false)
  }

  const handleLike = async () => {
    if (likeLoading) return
    setLikeLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let identifier = user?.id
    if (!identifier) {
      let anonId = localStorage.getItem('anon_id')
      if (!anonId) {
        anonId = crypto.randomUUID()
        localStorage.setItem('anon_id', anonId)
      }
      identifier = anonId
    }

    if (liked) {
      // 좋아요 취소
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_identifier', identifier)

      await supabase
        .from('posts')
        .update({ likes: likes - 1 })
        .eq('id', post.id)

      setLikes(prev => prev - 1)
      setLiked(false)
    } else {
      // 좋아요 추가
      await supabase
        .from('post_likes')
        .insert({ post_id: post.id, user_identifier: identifier })

      await supabase
        .from('posts')
        .update({ likes: likes + 1 })
        .eq('id', post.id)

      setLikes(prev => prev + 1)
      setLiked(true)

      const { data: postData } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', post.id)
        .single()

      if (postData?.user_id && postData.user_id !== user?.id) {
        const fromUserName = user?.user_metadata?.nickname ?? user?.email?.split('@')[0] ?? '익명'
        await fetch(`${window.location.origin}/api/notifications/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: postData.user_id,
            type: 'like',
            post_id: post.id,
            from_user_name: fromUserName,
            from_avatar_url: user?.user_metadata?.avatar_url ?? null,
            message: `${fromUserName}님이 좋아요를 눌렀습니다`,
          }),
        })
      }
    }

    setLikeLoading(false)
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      isKo ? '정말 삭제하시겠습니까?' : 'Are you sure you want to delete this post?'
    )
    if (!confirmed) return
    const supabase = createClient()
    await supabase.from('posts').delete().eq('id', post.id)
    router.push(`/${locale}/community`)
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/${locale}/community`}
        className="text-sm text-gray-400 hover:text-sky-500 transition-colors flex items-center gap-1 w-fit"
      >
        ← {isKo ? '커뮤니티' : 'Back to community'}
      </Link>

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cat.color}`}>
            {isKo ? cat.ko : cat.en}
          </span>
          {post.city && (
            <span className="text-xs text-gray-400">📍 {post.city}</span>
          )}
          <span className="text-xs text-gray-300 ml-auto">{date}</span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-4">{post.title}</h1>

        <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
          {post.avatar_url ? (
            <img
              src={post.avatar_url}
              alt={post.user_name ?? ''}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sm">
              {post.user_level_emoji ?? '👤'}
            </div>
          )}
          <span className="text-sm font-medium text-gray-700">
            {post.nation ?? ''} {post.user_name ?? (isKo ? '익명' : 'Anonymous')}
          </span>
          {currentUserId && post.user_id && currentUserId !== post.user_id && (
            <button
              onClick={() => router.push(`/${locale}/messages/${post.user_id}`)}
              className="text-xs text-gray-400 hover:text-sky-500 cursor-pointer ml-1 transition-colors"
              title={isKo ? '쪽지 보내기' : 'Send message'}
            >
              ✉️
            </button>
          )}
        </div>

        <div className="py-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>

        <div className="flex justify-end mb-2">
          <button
            onClick={handleTranslate}
            disabled={translating}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-sky-500 transition-colors border border-gray-200 rounded-lg px-3 py-1.5 hover:border-sky-300"
          >
            {translating ? (
              <span className="w-3 h-3 border border-sky-400 border-t-transparent rounded-full animate-spin" />
            ) : '🌐'}
            {translating
              ? (isKo ? '번역 중...' : 'Translating...')
              : showTranslated
              ? (isKo ? '원문 보기' : 'Show original')
              : (isKo ? '번역 보기' : 'Translate')}
          </button>
        </div>

        {showTranslated && translated && (
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 mb-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            <p className="text-[10px] text-sky-400 font-medium mb-2">🌐 {isKo ? '번역' : 'Translation'}</p>
            {translated}
          </div>
        )}

        {post.photo_url && (
          <>
            <div
              className="w-full rounded-xl overflow-hidden mt-2 cursor-zoom-in"
              onClick={() => setModalSrc(post.photo_url!)}
            >
              <img
                src={post.photo_url}
                alt={post.title}
                className="w-full max-h-96 object-cover rounded-xl hover:opacity-95 transition-opacity"
              />
            </div>
            {modalSrc && (
              <div
                className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                onClick={() => setModalSrc(null)}
              >
                <button
                  onClick={() => setModalSrc(null)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full bg-black/30"
                >
                  ✕
                </button>
                <img
                  src={modalSrc}
                  alt={post.title}
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </>
        )}

        {/* 좋아요 + 수정/삭제 버튼 */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              liked
                ? 'bg-orange-100 text-orange-500 border border-orange-200'
                : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-orange-50 hover:text-orange-400 hover:border-orange-200'
            }`}
          >
            <span className="text-base">{liked ? '🔥' : '🤍'}</span>
            {likes}
          </button>
          {currentUserId && post.user_id && currentUserId === post.user_id && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => router.push(`/${locale}/community/edit/${post.id}`)}
                className="text-sm text-sky-500 border border-sky-200 px-3 py-2 rounded-xl hover:bg-sky-50 transition-colors"
              >
                {isKo ? '수정' : 'Edit'}
              </button>
              <button
                onClick={handleDelete}
                className="text-sm text-red-400 border border-red-100 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
              >
                {isKo ? '삭제' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
