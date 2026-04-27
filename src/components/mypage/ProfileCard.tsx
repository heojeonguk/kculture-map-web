'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ProfileCardProps {
  user: any
  locale: string
  postCount: number
}

const levels = [
  { min: 0, max: 1, emoji: '🌱', ko: '새싹 여행자', en: 'Sprout Traveler', lv: 1 },
  { min: 1, max: 5, emoji: '🗺️', ko: '초보 여행자', en: 'Beginner Traveler', lv: 2 },
  { min: 5, max: 10, emoji: '✈️', ko: '여행 마니아', en: 'Travel Enthusiast', lv: 3 },
  { min: 10, max: 20, emoji: '🏆', ko: '여행 전문가', en: 'Travel Expert', lv: 4 },
  { min: 20, max: Infinity, emoji: '👑', ko: '여행 마스터', en: 'Travel Master', lv: 5 },
]

function getLevel(count: number) {
  return levels.find(l => count >= l.min && count < l.max) ?? levels[levels.length - 1]
}

function getLevelProgress(count: number) {
  const level = getLevel(count)
  if (level.lv === 5) return 100
  return Math.min(((count - level.min) / (level.max - level.min)) * 100, 100)
}

export default function ProfileCard({ user, locale, postCount }: ProfileCardProps) {
  const isKo = locale === 'ko'
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const nickname = user.user_metadata?.nickname ?? user.email?.split('@')[0] ?? '익명'
  const joinDate = new Date(user.created_at).toLocaleDateString(
    isKo ? 'ko-KR' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )

  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.user_metadata?.avatar_url ?? null)
  const [uploading, setUploading] = useState(false)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `profiles/${user.id}_${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('community-photos')
      .upload(path, file, { upsert: true })

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('community-photos')
        .getPublicUrl(path)
      const publicUrl = urlData.publicUrl
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })
      setAvatarUrl(publicUrl)
    }
    setUploading(false)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${locale}`)
    router.refresh()
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <div className="flex items-center gap-4 mb-5">
        <div
          className="relative w-16 h-16 rounded-full shrink-0 cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center">
              <span className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : avatarUrl ? (
            <img src={avatarUrl} alt={nickname} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center text-2xl font-bold text-sky-600">
              {nickname.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-xl">📷</span>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
        <div>
          <h2 className="text-lg font-bold text-gray-800">{nickname}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 py-4 border-t border-b border-gray-100 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">{isKo ? '가입일' : 'Joined'}</span>
          <span className="text-gray-700">{joinDate}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">{isKo ? '이메일' : 'Email'}</span>
          <span className="text-gray-700 truncate max-w-[200px]">{user.email}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">{isKo ? '프로필 사진' : 'Profile photo'}</span>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sky-500 hover:text-sky-600 text-xs hover:underline transition-colors"
          >
            {isKo ? '프로필 사진 변경' : 'Change photo'}
          </button>
        </div>
      </div>

      {/* 여행자 레벨 게이지 */}
      <div className="mb-4 bg-gray-50 rounded-xl p-4">
        {(() => {
          const level = getLevel(postCount)
          const progress = getLevelProgress(postCount)
          const nextLevel = levels.find(l => l.lv === level.lv + 1)
          return (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">
                  {level.emoji} {isKo ? level.ko : level.en}
                </span>
                <span className="text-xs font-bold text-sky-500">Lv.{level.lv}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>{isKo ? `게시글 ${postCount}개` : `${postCount} posts`}</span>
                {nextLevel && (
                  <span>{isKo ? `다음 레벨까지 ${nextLevel.min - postCount}개` : `${nextLevel.min - postCount} more to Lv.${nextLevel.lv}`}</span>
                )}
              </div>
            </>
          )
        })()}
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-2 border border-red-100 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
      >
        {isKo ? '로그아웃' : 'Logout'}
      </button>
    </div>
  )
}
