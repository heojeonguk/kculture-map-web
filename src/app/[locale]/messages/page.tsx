'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Conversation {
  userId: string
  userName: string
  lastMessage: string
  lastTime: string
  unreadCount: number
}

export default function MessagesPage() {
  const params = useParams()
  const locale = params.locale as string
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push(`/${locale}/auth/login`); return }
      setCurrentUserId(data.user.id)

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${data.user.id},receiver_id.eq.${data.user.id}`)
        .order('created_at', { ascending: false })

      if (msgs) {
        const convMap = new Map<string, Conversation>()
        msgs.forEach(msg => {
          const otherId = msg.sender_id === data.user.id ? msg.receiver_id : msg.sender_id
          const otherName = msg.sender_id === data.user.id ? msg.receiver_name : msg.sender_name
          if (!convMap.has(otherId)) {
            convMap.set(otherId, {
              userId: otherId,
              userName: otherName ?? '상대방',
              lastMessage: msg.content,
              lastTime: msg.created_at,
              unreadCount: (!msg.is_read && msg.receiver_id === data.user.id) ? 1 : 0,
            })
          } else {
            const existing = convMap.get(otherId)!
            if (!msg.is_read && msg.receiver_id === data.user.id) {
              existing.unreadCount++
            }
          }
        })
        setConversations(Array.from(convMap.values()))
      }
      setLoading(false)
    })
  }, [])

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '방금 전'
    if (mins < 60) return `${mins}분 전`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}시간 전`
    return `${Math.floor(hours / 24)}일 전`
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">✉️ 쪽지함</h1>
        <button
          onClick={() => router.push(`/${locale}`)}
          className="text-sm text-gray-400 hover:text-sky-500 transition-colors"
        >
          ← 홈으로
        </button>
      </div>
      {loading ? (
        <div className="text-center py-10 text-gray-400">불러오는 중...</div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-10 text-gray-400">쪽지가 없습니다</div>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map(conv => (
            <Link
              key={conv.userId}
              href={`/${locale}/messages/${conv.userId}`}
              className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:border-sky-200 hover:bg-sky-50 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sm font-bold text-sky-600 shrink-0">
                {conv.userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800 text-sm">{conv.userName}</span>
                  <span className="text-xs text-gray-400">{formatTime(conv.lastTime)}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shrink-0">
                  {conv.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
