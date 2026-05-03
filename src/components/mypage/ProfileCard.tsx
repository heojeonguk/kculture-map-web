'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface ProfileCardProps {
  user: User
  locale: string
  postCount: number
  commentCount: number
  followerCount: number
}

interface Level {
  min: number
  max: number
  emoji: string
  en: string
  lv: number
}

const levels: Level[] = [
  { min: 0, max: 0, emoji: '🌱', en: 'Sprout Traveler', lv: 1 },
  { min: 1, max: 9, emoji: '🗺️', en: 'Novice Traveler', lv: 2 },
  { min: 10, max: 99, emoji: '✈️', en: 'Travel Maniac', lv: 3 },
  { min: 100, max: 499, emoji: '🏆', en: 'Travel Expert', lv: 4 },
  { min: 500, max: Infinity, emoji: '👑', en: 'Travel Master', lv: 5 },
]

function getLevel(postCount: number, commentCount: number, followerCount: number): Level {
  if (postCount === 0) return levels[0]
  if (postCount <= 9) return levels[1]
  if (postCount <= 99) return commentCount >= 50 ? levels[2] : levels[1]
  if (postCount <= 499) return commentCount >= 100 ? levels[3] : levels[2]
  return (commentCount >= 100 && followerCount >= 100) ? levels[4] : levels[3]
}

function getLevelProgress(postCount: number, level: Level): number {
  if (level.lv === 5) return 100
  if (level.max === 0) return 0
  return Math.min(((postCount - level.min) / (level.max - level.min + 1)) * 100, 100)
}

export default function ProfileCard({ user, locale, postCount, commentCount, followerCount }: ProfileCardProps) {
  const t = useTranslations('mypage')
  const tAuth = useTranslations('auth')
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const nickname = user.user_metadata?.nickname ?? user.email?.split('@')[0] ?? '?'
  const joinDate = new Date(user.created_at).toLocaleDateString(locale, {
    year: 'numeric', month: 'long', day: 'numeric',
  })

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
      const { data: urlData } = supabase.storage.from('community-photos').getPublicUrl(path)
      await supabase.auth.updateUser({ data: { avatar_url: urlData.publicUrl } })
      setAvatarUrl(urlData.publicUrl)
    }
    setUploading(false)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${locale}`)
    router.refresh()
  }

  const level = getLevel(postCount, commentCount, followerCount)
  const progress = getLevelProgress(postCount, level)

  let unmet = ''
  if (postCount >= 10 && postCount <= 99 && commentCount < 50) {
    unmet = t('needComments', { count: 50 - commentCount })
  } else if (postCount >= 100 && postCount <= 499 && commentCount < 100) {
    unmet = t('needComments', { count: 100 - commentCount })
  } else if (postCount >= 500) {
    const parts: string[] = []
    if (commentCount < 100) parts.push(t('needComments', { count: 100 - commentCount }))
    if (followerCount < 100) parts.push(t('needFollowers', { count: 100 - followerCount }))
    unmet = parts.join(', ')
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
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        <div>
          <h2 className="text-lg font-bold text-gray-800">{nickname}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 py-4 border-t border-b border-gray-100 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">{t('joined')}</span>
          <span className="text-gray-700">{joinDate}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">{tAuth('email')}</span>
          <span className="text-gray-700 truncate max-w-[200px]">{user.email}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">{t('profilePhoto')}</span>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sky-500 hover:text-sky-600 text-xs hover:underline transition-colors"
          >
            {t('changePhoto')}
          </button>
        </div>
      </div>

      {/* 여행자 레벨 게이지 */}
      <div className="mb-4 bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">
            {level.emoji} {level.en}
          </span>
          <span className="text-xs font-bold text-sky-500">Lv.{level.lv}</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-1.5">
          <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>{t('postCount', { count: postCount })}</span>
          {unmet ? (
            <span className="text-orange-400">{unmet}</span>
          ) : level.lv === 1 ? (
            <span>{t('level1Next')}</span>
          ) : level.lv < 5 ? (
            <span>{t('postsToReach', { lv: level.lv + 1 })}</span>
          ) : null}
        </div>
      </div>

      {/* 레벨 달성 조건 */}
      <div className="mb-3">
        <details className="group">
          <summary className="cursor-pointer text-xs text-sky-500 hover:text-sky-600 flex items-center gap-1 list-none">
            <span>🏅 {t('viewLevelConditions')}</span>
            <span className="group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 bg-gray-50 rounded-xl p-3 flex flex-col gap-1.5 text-xs text-gray-600">
            <div className="flex items-center gap-2"><span>🌱</span><span>{t('level1Desc')}</span></div>
            <div className="flex items-center gap-2"><span>🗺️</span><span>{t('level2Desc')}</span></div>
            <div className="flex items-center gap-2"><span>✈️</span><span>{t('level3Desc')}</span></div>
            <div className="flex items-center gap-2"><span>🏆</span><span>{t('level4Desc')}</span></div>
            <div className="flex items-center gap-2"><span>👑</span><span>{t('level5Desc')}</span></div>
          </div>
        </details>
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-2 border border-red-100 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
      >
        {tAuth('logout')}
      </button>
    </div>
  )
}
