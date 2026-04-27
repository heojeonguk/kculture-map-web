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
  photo_url?: string
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
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [modalImg, setModalImg] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push(`/${locale}/auth/login`); return }
      setCurrentUser(data.user)

      const { data: nickData } = await supabase
        .from('nicknames')
        .select('nickname')
        .eq('user_id', data.user.id)
        .single()
      const myNick = nickData?.nickname ?? data.user.email?.split('@')[0] ?? '익명'
      setCurrentNickname(myNick)

      const { data: receiverNick } = await supabase
        .from('nicknames')
        .select('nickname')
        .eq('user_id', receiverUserId)
        .single()
      setReceiverName(receiverNick?.nickname ?? '상대방')

      fetchMessages(data.user.id)

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
    if ((!input.trim() && !photoFile) || !currentUser || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')

    const supabase = createClient()

    let photoUrl: string | null = null
    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const path = `messages/${currentUser.id}_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('community-photos')
        .upload(path, photoFile, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('community-photos')
          .getPublicUrl(path)
        photoUrl = urlData.publicUrl
      }
      setPhotoFile(null)
      setPhotoPreview(null)
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: currentUser.id,
        receiver_id: receiverUserId,
        content,
        sender_name: currentNickname,
        receiver_name: receiverName,
        is_read: false,
        ...(photoUrl ? { photo_url: photoUrl } : {}),
      })
      .select('*')
      .single()

    if (error) {
      console.error('메시지 전송 에러:', error.message, error.details, error.hint)
      setSending(false)
      return
    }

    if (data) {
      setMessages(prev => [...prev, data])

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
      {modalImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setModalImg(null)}
        >
          <button
            onClick={() => setModalImg(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full bg-black/30"
          >
            ×
          </button>
          <img
            src={modalImg}
            alt="사진 원본"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
      {/* 상단 헤더 */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100 shrink-0">
        <button onClick={() => router.push(`/${locale}/messages`)} className="text-gray-400 hover:text-gray-600 text-xl px-1">
          ←
        </button>
        <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sm font-bold text-sky-600">
          {receiverName.charAt(0).toUpperCase()}
        </div>
        <span className="font-semibold text-gray-800 flex-1">{receiverName}</span>
        <button
          onClick={() => router.push(`/${locale}`)}
          className="text-sm text-gray-500 hover:text-sky-500 transition-colors flex items-center gap-1"
        >
          🏠 <span className="text-xs">홈</span>
        </button>
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
                  {msg.photo_url && (
                    <img
                      src={msg.photo_url}
                      alt="사진"
                      className="max-w-[200px] rounded-lg mb-1 cursor-zoom-in hover:opacity-90 transition-opacity"
                      onClick={() => setModalImg(msg.photo_url!)}
                    />
                  )}
                  {msg.content && msg.content}
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
      <div className="shrink-0 pt-3 border-t border-gray-100">
        {photoPreview && (
          <div className="relative mb-2 w-24 h-24">
            <img src={photoPreview} className="w-24 h-24 object-cover rounded-xl" alt="preview" />
            <button
              onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-gray-500 text-white rounded-full text-xs flex items-center justify-center"
            >×</button>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) {
                  setPhotoFile(file)
                  setPhotoPreview(URL.createObjectURL(file))
                }
              }
              input.click()
            }}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-sky-500 border border-gray-200 rounded-xl transition-colors shrink-0"
          >
            📷
          </button>
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
            disabled={sending || (!input.trim() && !photoFile)}
            className="bg-sky-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-sky-600 disabled:opacity-50 transition-colors shrink-0"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  )
}
