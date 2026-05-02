'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
  tags?: string[]
}

interface PostDetailProps {
  post: Post
  locale: string
}

const categoryColor: Record<string, string> = {
  food: 'text-orange-500 bg-orange-50',
  spot: 'text-blue-500 bg-blue-50',
  cafe: 'text-amber-500 bg-amber-50',
  activity: 'text-sky-500 bg-sky-50',
  free: 'text-gray-500 bg-gray-100',
  review: 'text-purple-500 bg-purple-50',
}

export default function PostDetail({ post, locale }: PostDetailProps) {
  const t = useTranslations('community')
  const tCategory = useTranslations('category')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const color = categoryColor[post.category ?? 'free'] ?? categoryColor.free
  const date = new Date(post.created_at).toLocaleDateString(
    locale,
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
  const [authorDropdown, setAuthorDropdown] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const authorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (authorRef.current && !authorRef.current.contains(e.target as Node)) {
        setAuthorDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const checkLiked = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        if (post.user_id && user.id !== post.user_id) {
          const { data: follow } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', post.user_id)
            .single()
          if (follow) setIsFollowing(true)
        }
      }
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
  }, [post.id, post.user_id])

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
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_identifier', identifier)
      await supabase.from('posts').update({ likes: likes - 1 }).eq('id', post.id)
      setLikes(prev => prev - 1)
      setLiked(false)
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_identifier: identifier })
      await supabase.from('posts').update({ likes: likes + 1 }).eq('id', post.id)
      setLikes(prev => prev + 1)
      setLiked(true)

      const { data: postData } = await supabase.from('posts').select('user_id').eq('id', post.id).single()
      if (postData?.user_id && postData.user_id !== user?.id) {
        const fromUserName = user?.user_metadata?.nickname ?? user?.email?.split('@')[0] ?? t('anonymous')
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

  const handleFollow = async () => {
    if (!currentUserId || !post.user_id) return
    const supabase = createClient()
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', post.user_id)
      setIsFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: post.user_id })
      setIsFollowing(true)
      const { data: { user } } = await supabase.auth.getUser()
      const fromUserName = user?.user_metadata?.nickname ?? user?.email?.split('@')[0] ?? t('anonymous')
      await fetch(`${window.location.origin}/api/notifications/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: post.user_id,
          type: 'follow',
          post_id: null,
          from_user_name: fromUserName,
          from_avatar_url: user?.user_metadata?.avatar_url ?? null,
          message: `${fromUserName}님이 팔로우했습니다`,
        }),
      })
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(t('deleteConfirm'))
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
        ← {t('title')}
      </Link>

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>
            {tCategory(post.category ?? 'free')}
          </span>
          {post.city && (
            <span className="text-xs text-gray-400">📍 {post.city}</span>
          )}
          <span className="text-xs text-gray-300 ml-auto">{date}</span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-4">{post.title}</h1>

        <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
          <div className="relative shrink-0">
            {post.avatar_url ? (
              <img
                src={post.avatar_url}
                alt={post.user_name ?? ''}
                className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setModalSrc(post.avatar_url!)}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sm font-bold text-sky-600">
                {(post.user_name ?? 'A').charAt(0).toUpperCase()}
              </div>
            )}
            {post.user_level_emoji && (
              <span className="absolute -bottom-1 -right-1 text-xs leading-none">
                {post.user_level_emoji}
              </span>
            )}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {post.nation ?? ''} {post.user_name ?? t('anonymous')}
          </span>
        </div>

        <div className="py-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap pb-4">
            {post.tags.map(tag => (
              <button
                key={tag}
                onClick={() => router.push(`/${locale}/community?tag=${tag}`)}
                className="text-xs text-blue-500 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

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
              ? t('translating')
              : showTranslated
              ? t('showOriginal')
              : t('translate')}
          </button>
        </div>

        {showTranslated && translated && (
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 mb-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            <p className="text-[10px] text-sky-400 font-medium mb-2">🌐 {t('translate')}</p>
            {translated}
          </div>
        )}

        {post.photo_url && (
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
        )}

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
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              alert(t('linkCopied'))
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 transition-all"
          >
            🔗 {tCommon('share')}
          </button>
          {currentUserId && post.user_id && currentUserId === post.user_id && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => router.push(`/${locale}/community/edit/${post.id}`)}
                className="text-sm text-sky-500 border border-sky-200 px-3 py-2 rounded-xl hover:bg-sky-50 transition-colors"
              >
                {t('edit')}
              </button>
              <button
                onClick={handleDelete}
                className="text-sm text-red-400 border border-red-100 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
              >
                {t('delete')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
