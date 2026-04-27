'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  sender_name: string
  receiver_name: string
  is_read: boolean
  created_at: string
}

export default function DMPage() {
  const params = useParams()
  const locale = params.locale as string
  const receiverUserId = params.userId as string
  const router = useRouter()

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentNickname, setCurrentNickname] = useState('')
  const [receiverName, setReceiverName] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push(`/${locale}/auth/login`); return }
      setCurrentUser(data.user)

      // 닉네임 조회
      const { data: nickData } = await supabase
        .from('nicknames')
        .select('nickname')
        .eq('user_id', data.user.id)
        .single()
      const myNick = nickData?.nickname ?? data.user.email?.split('@')[0] ?? '익명'
      setCurrentNickname(myNick)

      // 상대방 닉네임 조회
      const { data: receiverNick } = await supabase
        .from('nicknames')
        .select('nickname')
        .eq('user_id', receiverUserId)
        .single()
      setReceiverName(receiverNick?.nickname ?? '상대방')

      // 메시지 조회
      fetchMessages(data.user.id)

      // 읽음 처리
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', receiverUserId)
        .eq('receiver_id', data.user.id)
        .eq('is_read', false)
    })
  }, [receiverUserId])

  const fetchMessages = async (myId: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${receiverUserId}),and(sender_id.eq.${receiverUserId},receiver_id.eq.${myId})`)
      .order('created_at', { ascending: true })
    if (!error && data) setMessages(data)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !currentUser || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')

    const supabase = createClient()
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: currentUser.id,
        receiver_id: receiverUserId,
        content,
        sender_name: currentNickname,
        receiver_name: receiverName,
        is_read: false,
        topic: 'direct',
        extension: 'dm',
      })
      .select('*')
      .single()

    if (!error && data) {
      setMessages(prev => [...prev, data])

      // 알림 생성
      await fetch(`${window.location.origin}/api/notifications/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: receiverUserId,
          type: 'message',
          post_id: null,
          from_user_name: currentNickname,
          from_avatar_url: null,
          message: `✉️ ${currentNickname}님이 메시지를 보냈습니다: "${content.slice(0, 20)}${content.length > 20 ? '...' : ''}"`,
        }),
      })
    }
    setSending(false)
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString(locale === 'ko' ? 'ko-KR' : 'en-US', {
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-56px)]">
      {/* 상단 헤더 */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100 shrink-0">
        <button onClick={() => router.push(`/${locale}/messages`)} className="text-gray-400 hover:text-gray-600">
          ←
        </button>
        <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sm font-bold text-sky-600">
          {receiverName.charAt(0).toUpperCase()}
        </div>
        <span className="font-semibold text-gray-800">{receiverName}</span>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
        {messages.map(msg => {
          const isMine = msg.sender_id === currentUser?.id
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className="flex flex-col gap-1 max-w-[70%]">
                <div className={`px-4 py-2 rounded-2xl text-sm ${
                  isMine
                    ? 'bg-sky-500 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
                <span className={`text-xs text-gray-400 ${isMine ? 'text-right' : 'text-left'}`}>
                  {formatTime(msg.created_at)}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="shrink-0 flex gap-2 pt-3 border-t border-gray-100">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="메시지를 입력하세요..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-300"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="bg-sky-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-sky-600 disabled:opacity-50 transition-colors"
        >
          전송
        </button>
      </div>
    </div>
  )
}
