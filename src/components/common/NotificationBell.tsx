'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { api } from '@/lib/api'

interface Notification {
  id: string
  type: 'comment' | 'like'
  post_id: string
  from_user_name: string
  from_avatar_url: string | null
  message: string
  is_read: boolean
  created_at: string
}

export default function NotificationBell() {
  const { user } = useCurrentUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const unreadCount = notifications.filter(n => !n.is_read).length

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const data = await api.notifications.list(user.id)
      setNotifications(data.notifications || [])
    } catch {}
  }, [user])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    window.addEventListener('focus', fetchNotifications)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', fetchNotifications)
    }
  }, [fetchNotifications])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpen = async () => {
    setOpen(prev => !prev)
    if (!open && unreadCount > 0 && user) {
      await api.notifications.markRead(user.id)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    }
  }

  const handleClickNotification = (postId: string) => {
    setOpen(false)
    router.push(`/community/${postId}`)
  }

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '방금 전'
    if (mins < 60) return `${mins}분 전`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}시간 전`
    return `${Math.floor(hours / 24)}일 전`
  }

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="알림"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-800">알림</span>
            {notifications.length > 0 && (
              <span className="text-xs text-gray-400">{notifications.length}개</span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                알림이 없습니다
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClickNotification(n.post_id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                    !n.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">
                      {n.type === 'comment' ? '💬' : '🔥'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatTime(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
