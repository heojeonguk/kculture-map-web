'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Header from '@/components/layout/Header'

interface Conversation {
  other_user_id: string
  other_user_name: string
  last_message: string
  last_message_at: string
  unread_count: number
}

export default function MessagesPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const isKo = locale === 'ko'

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace(`/${locale}/auth/login`)
        return
      }

      const res = await fetch(`${window.location.origin}/api/messages/conversations?user_id=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
      setLoading(false)
    }
    init()
  }, [locale])

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return isKo ? '방금 전' : 'just now'
    if (mins < 60) return isKo ? `${mins}분 전` : `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return isKo ? `${hours}시간 전` : `${hours}h ago`
    return isKo ? `${Math.floor(hours / 24)}일 전` : `${Math.floor(hours / 24)}d ago`
  }

  return (
    <>
      <Header locale={locale} />
      <main className="max-w-[600px] mx-auto px-4 py-6">
        <h1 className="text-lg font-bold text-gray-900 mb-4">
          ✉️ {isKo ? '쪽지함' : 'Messages'}
        </h1>

        {loading ? (
          <div className="flex justify-center py-10">
            <span className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            {isKo ? '받은 쪽지가 없습니다' : 'No messages yet'}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {conversations.map(conv => (
              <Link
                key={conv.other_user_id}
                href={`/${locale}/messages/${conv.other_user_id}`}
                className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-4 hover:border-sky-200 hover:bg-sky-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sm font-bold text-sky-600 shrink-0">
                  {(conv.other_user_name ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-gray-800">{conv.other_user_name}</span>
                    <span className="text-[10px] text-gray-400">{formatTime(conv.last_message_at)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{conv.last_message}</p>
                </div>
                {conv.unread_count > 0 && (
                  <span className="min-w-[20px] h-5 bg-sky-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shrink-0">
                    {conv.unread_count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
