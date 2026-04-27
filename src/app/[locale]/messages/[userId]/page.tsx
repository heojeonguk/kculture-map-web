'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  sender_name: string
  receiver_name: string
  content: string
  is_read: boolean
  created_at: string
}

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const otherUserId = params.userId as string
  const isKo = locale === 'ko'

  const [messages, setMessages] = useState<Message[]>([])
  const [myId, setMyId] = useState<string | null>(null)
  const [myName, setMyName] = useState('')
  const [otherName, setOtherName] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace(`/${locale}/auth/login`)
        return
      }

      const me = user.id
      const name = user.user_metadata?.nickname ?? user.email?.split('@')[0] ?? '익명'
      setMyId(me)
      setMyName(name)

      // 메시지 조회
      const res = await fetch(
        `${window.location.origin}/api/messages?sender_id=${me}&receiver_id=${otherUserId}`
      )
      if (res.ok) {
        const data = await res.json()
        const msgs: Message[] = data.messages || []
        setMessages(msgs)

        // 상대방 이름 추출
        const fromMsg = msgs.find(m => m.sender_id === otherUserId)
        const toMsg = msgs.find(m => m.receiver_id === otherUserId)
        if (fromMsg) setOtherName(fromMsg.sender_name)
        else if (toMsg) setOtherName(toMsg.receiver_name)
        else {
          // nicknames 테이블에서 조회
          const { data: nick } = await supabase
            .from('nicknames')
            .select('nickname')
            .eq('user_id', otherUserId)
            .single()
          setOtherName(nick?.nickname ?? otherUserId)
        }

        // 상대방이 보낸 메시지 읽음 처리
        const unreadIds = msgs
          .filter(m => m.sender_id === otherUserId && !m.is_read)
          .map(m => m.id)
        if (unreadIds.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadIds)
        }
      }
      setLoading(false)
    }
    init()
  }, [locale, otherUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!content.trim() || !myId || sending) return
    setSending(true)

    const res = await fetch(`${window.location.origin}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_id: myId,
        receiver_id: otherUserId,
        content: content.trim(),
        sender_name: myName,
        receiver_name: otherName,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      setMessages(prev => [...prev, data.message])
      setContent('')

      // 알림 전송
      await fetch(`${window.location.origin}/api/notifications/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: otherUserId,
          type: 'message',
          post_id: null,
          from_user_name: myName,
          from_avatar_url: null,
          message: `✉️ ${myName}님이 메시지를 보냈습니다: "${content.trim().slice(0, 20)}..."`,
        }),
      })
    }
    setSending(false)
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString(isKo ? 'ko-KR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <Header locale={locale} />
      <main className="max-w-[600px] mx-auto px-4 py-4 flex flex-col h-[calc(100vh-56px)]">
        {/* 상단 헤더 */}
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-3">
          <button
            onClick={() => router.push(`/${locale}/messages`)}
            className="text-gray-400 hover:text-sky-500 transition-colors text-lg"
          >
            ←
          </button>
          <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-xs font-bold text-sky-600">
            {(otherName || '?').charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-gray-800 text-sm">
            {otherName || otherUserId}
          </span>
        </div>

        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pb-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <span className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              {isKo ? '첫 메시지를 보내보세요!' : 'Send your first message!'}
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.sender_id === myId
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      isMine
                        ? 'bg-sky-500 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* 입력창 */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <input
            type="text"
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={isKo ? '메시지를 입력하세요...' : 'Type a message...'}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-sky-400 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={sending || !content.trim()}
            className="px-4 py-2.5 bg-sky-500 text-white rounded-xl text-sm font-medium hover:bg-sky-600 transition-colors disabled:opacity-40"
          >
            {isKo ? '전송' : 'Send'}
          </button>
        </div>
      </main>
    </>
  )
}
