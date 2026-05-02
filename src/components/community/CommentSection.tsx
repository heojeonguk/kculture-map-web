'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useFollow } from '@/hooks/useFollow'
import { api } from '@/lib/api'

interface Comment {
  id: string
  content: string
  user_id?: string
  user_name?: string
  user_level_emoji?: string
  avatar_url?: string
  nation?: string
  created_at: string
  parent_id?: string | null
  children?: Comment[]
}

interface CommentSectionProps {
  comments: Comment[]
  postId: string
  locale: string
}

function timeAgo(dateStr: string, locale: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (mins < 1) return rtf.format(0, 'second')
  if (mins < 60) return rtf.format(-mins, 'minute')
  if (hours < 24) return rtf.format(-hours, 'hour')
  return rtf.format(-days, 'day')
}

function buildTree(comments: Comment[]): Comment[] {
  const map: Record<string, Comment> = {}
  const roots: Comment[] = []
  comments.forEach(c => { map[c.id] = { ...c, children: [] } })
  comments.forEach(c => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].children!.push(map[c.id])
    } else {
      roots.push(map[c.id])
    }
  })
  return roots
}

interface CommentItemProps {
  comment: Comment
  postId: string
  locale: string
  user: User | null
  onReply: (parentId: string, content: string) => Promise<void>
  depth?: number
}

function CommentItem({ comment, postId, locale, user, onReply, depth = 0 }: CommentItemProps) {
  const t = useTranslations('community')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [translated, setTranslated] = useState<string | null>(null)
  const [translating, setTranslating] = useState(false)
  const [showTranslated, setShowTranslated] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [modalPhoto, setModalPhoto] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { isFollowing, toggleFollow } = useFollow(comment.user_id, user?.id ?? null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTranslate = async () => {
    if (translated) { setShowTranslated(!showTranslated); return }
    setTranslating(true)
    try {
      const data = await api.translate(comment.content, locale)
      setTranslated(data.translated)
      setShowTranslated(true)
    } catch {}
    setTranslating(false)
  }

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return
    setSubmitting(true)
    await onReply(comment.id, replyContent.trim())
    setReplyContent('')
    setShowReplyInput(false)
    setSubmitting(false)
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-sky-100 pl-3' : ''}`}>
      <div className="flex gap-3 py-2">
        {comment.avatar_url ? (
          <img
            src={comment.avatar_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setModalPhoto(comment.avatar_url!)}
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-xs font-bold text-sky-600 shrink-0 mt-0.5">
            {comment.user_name?.charAt(0).toUpperCase() ?? '?'}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            {comment.user_level_emoji && (
              <span className="text-xs">{comment.user_level_emoji}</span>
            )}

            {comment.user_id ? (
              <span className="relative inline-block" ref={dropdownRef}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowDropdown(prev => !prev)
                  }}
                  className="text-xs font-medium text-gray-700 hover:text-sky-500 transition-colors"
                  style={{ cursor: 'pointer' }}
                >
                  {comment.nation ?? ''} {comment.user_name ?? t('anonymous')}
                </a>
                {showDropdown && (
                  <div
                    className="absolute left-0 top-6 bg-white border border-gray-200 rounded-xl shadow-xl py-1"
                    style={{ zIndex: 9999, minWidth: '160px' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => { setShowDropdown(false); router.push(`/${locale}/profile/${comment.user_id}`) }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      👤 {t('viewProfile')}
                    </button>
                    {user && user.id !== comment.user_id && (
                      <>
                        <button
                          type="button"
                          onClick={() => { setShowDropdown(false); router.push(`/${locale}/messages/${comment.user_id}`) }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors flex items-center gap-2"
                        >
                          ✉️ {t('sendMessage')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const fromUserName = user?.user_metadata?.nickname ?? user?.email?.split('@')[0] ?? t('anonymous')
                            toggleFollow(fromUserName, user?.user_metadata?.avatar_url ?? null)
                            setShowDropdown(false)
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors flex items-center gap-2"
                        >
                          {isFollowing ? '✅' : '➕'} {isFollowing ? t('following') : t('follow')}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </span>
            ) : (
              <span className="text-xs font-medium text-gray-700">
                {comment.nation ?? ''} {comment.user_name ?? t('anonymous')}
              </span>
            )}

            <span className="text-[10px] text-gray-300" suppressHydrationWarning>
              {timeAgo(comment.created_at, locale)}
            </span>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">{comment.content}</p>

          {showTranslated && translated && (
            <div className="bg-sky-50 border border-sky-100 rounded-lg p-2.5 mt-1.5 text-xs text-gray-600 leading-relaxed">
              <p className="text-[9px] text-sky-400 font-medium mb-1">🌐 {t('translate')}</p>
              {translated}
            </div>
          )}

          <div className="flex items-center gap-3 mt-1">
            {user && depth < 2 && (
              <button
                type="button"
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="text-[11px] text-gray-400 hover:text-sky-500 transition-colors"
              >
                ↩ {t('reply')}
              </button>
            )}
            <button
              type="button"
              onClick={handleTranslate}
              disabled={translating}
              className="text-[11px] text-gray-400 hover:text-sky-500 transition-colors flex items-center gap-1"
            >
              {translating
                ? <span className="w-2.5 h-2.5 border border-sky-400 border-t-transparent rounded-full animate-spin" />
                : '🌐'}
              {translating
                ? t('translating')
                : showTranslated
                ? t('original')
                : t('translate')}
            </button>
          </div>

          {showReplyInput && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit()}
                placeholder={t('replyPlaceholder')}
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-sky-400 transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={handleReplySubmit}
                disabled={submitting || !replyContent.trim()}
                className="px-3 py-1.5 bg-sky-500 text-white rounded-xl text-xs font-medium hover:bg-sky-600 transition-colors disabled:opacity-40"
              >
                {t('submit')}
              </button>
              <button
                type="button"
                onClick={() => { setShowReplyInput(false); setReplyContent('') }}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-500 hover:bg-gray-50 transition-colors"
              >
                {tCommon('cancel')}
              </button>
            </div>
          )}
        </div>
      </div>

      {comment.children && comment.children.length > 0 && (
        <div className="mt-1">
          {comment.children.map(child => (
            <CommentItem
              key={child.id}
              comment={child}
              postId={postId}
              locale={locale}
              user={user}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {modalPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setModalPhoto(null)}
        >
          <button
            onClick={() => setModalPhoto(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full bg-black/30"
          >✕</button>
          <img
            src={modalPhoto}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

export default function CommentSection({ comments: initialComments, postId, locale }: CommentSectionProps) {
  const t = useTranslations('community')
  const [comments, setComments] = useState(initialComments)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user } = useCurrentUser()

  const tree = useMemo(() => buildTree(comments), [comments])
  const totalCount = comments.length

  const addComment = async (parentId: string | null, content: string) => {
    const supabase = createClient()
    const fromUserName = user?.user_metadata?.nickname ?? user?.email?.split('@')[0] ?? t('anonymous')

    const { data: newComment, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        content,
        parent_id: parentId,
        user_name: fromUserName,
        user_id: user?.id,
        avatar_url: user?.user_metadata?.avatar_url ?? null,
        user_level_emoji: user?.user_metadata?.level_emoji ?? '🌱',
      })
      .select('*')
      .single()

    if (!error && newComment) {
      setComments(prev => [...prev, newComment])

      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single()

      if (post?.user_id && post.user_id !== user?.id) {
        await api.notifications.create({
          user_id: post.user_id,
          type: 'comment',
          post_id: postId,
          from_user_name: fromUserName,
          from_avatar_url: user?.user_metadata?.avatar_url ?? null,
          message: `${fromUserName}님이 댓글을 달았습니다: ${content.slice(0, 20)}`,
        })
      }
    }
  }

  const handleSubmit = async () => {
    if (!content.trim() || !user) return
    setSubmitting(true)
    await addComment(null, content.trim())
    setContent('')
    setSubmitting(false)
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <h2 className="text-sm font-bold text-gray-800 mb-4">
        💬 {t('commentsCount', { count: totalCount })}
      </h2>

      {tree.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">{t('noComments')}</p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-50 mb-4">
          {tree.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              locale={locale}
              user={user}
              onReply={(parentId, content) => addComment(parentId, content)}
            />
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        {user ? (
          <div className="flex gap-2">
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-xs font-bold text-sky-600 shrink-0">
                {(user.user_metadata?.nickname ?? user.email ?? 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder={t('commentPlaceholder')}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-sky-400 transition-colors"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !content.trim()}
                className="px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-medium hover:bg-sky-600 transition-colors disabled:opacity-40"
              >
                {t('submit')}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">{t('loginRequired')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
