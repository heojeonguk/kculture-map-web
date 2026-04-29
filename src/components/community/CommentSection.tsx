'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Comment {
  id: string
  content: string
  user_id?: string
  user_name?: string
  nation?: string
  created_at: string
  user_level_emoji?: string
  parent_id?: string | null
  children?: Comment[]
}

interface CommentSectionProps {
  comments: Comment[]
  postId: string
  locale: string
}

function timeAgo(dateStr: string, isKo: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return isKo ? '방금 전' : 'just now'
  if (mins < 60) return isKo ? `${mins}분 전` : `${mins}m ago`
  if (hours < 24) return isKo ? `${hours}시간 전` : `${hours}h ago`
  return isKo ? `${days}일 전` : `${days}d ago`
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
  isKo: boolean
  user: any
  onReply: (parentId: string, content: string) => Promise<void>
  depth?: number
}

function CommentItem({ comment, postId, locale, isKo, user, onReply, depth = 0 }: CommentItemProps) {
  const router = useRouter()
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [translated, setTranslated] = useState<string | null>(null)
  const [translating, setTranslating] = useState(false)
  const [showTranslated, setShowTranslated] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!user || !comment.user_id || user.id === comment.user_id) return
    const supabase = createClient()
    supabase.from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', comment.user_id)
      .single()
      .then(({ data }) => { if (data) setIsFollowing(true) })
  }, [user, comment.user_id])

  const handleFollow = async () => {
    if (!user || !comment.user_id) return
    const supabase = createClient()
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', comment.user_id)
      setIsFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: comment.user_id })
      setIsFollowing(true)
      const fromUserName = user.user_metadata?.nickname ?? user.email?.split('@')[0] ?? '익명'
      await fetch(`${window.location.origin}/api/notifications/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: comment.user_id,
          type: 'follow',
          post_id: null,
          from_user_name: fromUserName,
          from_avatar_url: user.user_metadata?.avatar_url ?? null,
          message: `${fromUserName}님이 팔로우했습니다`,
        }),
      })
    }
  }

  const handleTranslate = async () => {
    if (translated) { setShowTranslated(!showTranslated); return }
    setTranslating(true)
    try {
      const response = await fetch(`${window.location.origin}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: comment.content, targetLocale: locale }),
      })
      const data = await response.json()
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
        <div className="w-7 h-7 rounded-full bg-sky-50 flex items-center justify-center text-xs shrink-0 mt-0.5">
          {comment.user_level_emoji ?? '🌍'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
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
                  {comment.nation ?? ''} {comment.user_name ?? (isKo ? '익명' : 'Anonymous')}
                </a>
                {showDropdown && (
                  <div
                    className="absolute left-0 top-6 bg-white border border-gray-200 rounded-xl shadow-xl py-1"
                    style={{ zIndex: 9999, minWidth: '160px' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowDropdown(false)
                        router.push(`/${locale}/profile/${comment.user_id}`)
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      👤 {isKo ? '프로필 보기' : 'View profile'}
                    </button>
                    {user && user.id !== comment.user_id && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDropdown(false)
                            router.push(`/${locale}/messages/${comment.user_id}`)
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors flex items-center gap-2"
                        >
                          ✉️ {isKo ? '메시지 보내기' : 'Send message'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleFollow()
                            setShowDropdown(false)
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors flex items-center gap-2"
                        >
                          {isFollowing ? '✅' : '➕'} {isFollowing ? (isKo ? '팔로잉' : 'Following') : (isKo ? '팔로우' : 'Follow')}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </span>
            ) : (
              <span className="text-xs font-medium text-gray-700">
                {comment.nation ?? ''} {comment.user_name ?? (isKo ? '익명' : 'Anonymous')}
              </span>
            )}
            <span className="text-[10px] text-gray-300">
              {timeAgo(comment.created_at, isKo)}
            </span>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">{comment.content}</p>

          {showTranslated && translated && (
            <div className="bg-sky-50 border border-sky-100 rounded-lg p-2.5 mt-1.5 text-xs text-gray-600 leading-relaxed">
              <p className="text-[9px] text-sky-400 font-medium mb-1">🌐 {isKo ? '번역' : 'Translation'}</p>
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
                {isKo ? '↩ 답글' : '↩ Reply'}
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
                ? (isKo ? '번역 중' : 'Translating')
                : showTranslated
                ? (isKo ? '원문' : 'Original')
                : (isKo ? '번역' : 'Translate')}
            </button>
          </div>

          {showReplyInput && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit()}
                placeholder={isKo ? '답글을 입력하세요...' : 'Write a reply...'}
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-sky-400 transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={handleReplySubmit}
                disabled={submitting || !replyContent.trim()}
                className="px-3 py-1.5 bg-sky-500 text-white rounded-xl text-xs font-medium hover:bg-sky-600 transition-colors disabled:opacity-40"
              >
                {isKo ? '등록' : 'Post'}
              </button>
              <button
                type="button"
                onClick={() => { setShowReplyInput(false); setReplyContent('') }}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-500 hover:bg-gray-50 transition-colors"
              >
                {isKo ? '취소' : 'Cancel'}
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
              isKo={isKo}
              user={user}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CommentSection({ comments: initialComments, postId, locale }: CommentSectionProps) {
  const isKo = locale === 'ko'
  const [comments, setComments] = useState(initialComments)
  const [user, setUser] = useState<any>(null)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user)
    })
  }, [])

  const addComment = async (parentId: string | null, content: string) => {
    const supabase = createClient()
    const fromUserName = user.user_metadata?.nickname ?? user.email?.split('@')[0] ?? '익명'

    const { data: newComment, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        content,
        parent_id: parentId,
        user_name: fromUserName,
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

      if (post?.user_id && post.user_id !== user.id) {
        await fetch(`${window.location.origin}/api/notifications/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: post.user_id,
            type: 'comment',
            post_id: postId,
            from_user_name: fromUserName,
            from_avatar_url: user.user_metadata?.avatar_url ?? null,
            message: `${fromUserName}님이 댓글을 달았습니다: ${content.slice(0, 20)}`,
          }),
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

  const tree = buildTree(comments)
  const totalCount = comments.length

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <h2 className="text-sm font-bold text-gray-800 mb-4">
        💬 {isKo ? `댓글 ${totalCount}개` : `${totalCount} Comments`}
      </h2>

      {tree.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          {isKo ? '첫 댓글을 남겨보세요!' : 'Be the first to comment!'}
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-50 mb-4">
          {tree.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              locale={locale}
              isKo={isKo}
              user={user}
              onReply={(parentId, content) => addComment(parentId, content)}
            />
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        {user ? (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-xs font-bold text-sky-600 shrink-0">
              {(user.user_metadata?.nickname ?? user.email ?? 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder={isKo ? '댓글을 입력하세요...' : 'Write a comment...'}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-sky-400 transition-colors"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !content.trim()}
                className="px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-medium hover:bg-sky-600 transition-colors disabled:opacity-40"
              >
                {isKo ? '등록' : 'Post'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">
              {isKo ? '댓글을 작성하려면 로그인이 필요합니다' : 'Please log in to write a comment'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
