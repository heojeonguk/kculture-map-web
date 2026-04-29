'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ProfileCardProps {
  user: any
  locale: string
  postCount: number
  commentCount: number
  followerCount: number
}

interface Level {
  min: number
  max: number
  emoji: string
  ko: string
  en: string
  lv: number
  nextText: (ko: boolean) => string
}

const levels: Level[] = [
  { min: 0, max: 0, emoji: '🌱', ko: '새싹 여행자', en: 'Sprout Traveler', lv: 1,
    nextText: (ko) => ko ? '게시글 10개 작성 시 레벨업' : 'Write 10 posts to level up' },
  { min: 1, max: 9, emoji: '🗺️', ko: '초보 여행자', en: 'Novice Traveler', lv: 2,
    nextText: (ko) => ko ? '게시글 10개 달성까지' : 'posts to reach Lv.3' },
  { min: 10, max: 99, emoji: '✈️', ko: '여행 마니아', en: 'Travel Maniac', lv: 3,
    nextText: (ko) => ko ? '게시글 100개+댓글 50개 달성까지' : 'posts+comments to reach Lv.4' },
  { min: 100, max: 499, emoji: '🏆', ko: '여행 전문가', en: 'Travel Expert', lv: 4,
    nextText: (ko) => ko ? '게시글 500개+댓글 100개 달성까지' : 'posts+comments to reach Lv.5' },
  { min: 500, max: Infinity, emoji: '👑', ko: '여행 마스터', en: 'Travel Master', lv: 5,
    nextText: () => '' },
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

function getUnmetCondition(postCount: number, commentCount: number, followerCount: number, isKo: boolean): string {
  if (postCount >= 10 && postCount <= 99 && commentCount < 50) {
    const need = 50 - commentCount
    return isKo ? `댓글 ${need}개 더 필요` : `Need ${need} more comments for Lv.3`
  }
  if (postCount >= 100 && postCount <= 499 && commentCount < 100) {
    const need = 100 - commentCount
    return isKo ? `댓글 ${need}개 더 필요` : `Need ${need} more comments for Lv.4`
  }
  if (postCount >= 500) {
    const parts: string[] = []
    if (commentCount < 100) parts.push(isKo ? `댓글 ${100 - commentCount}개` : `${100 - commentCount} comments`)
    if (followerCount < 100) parts.push(isKo ? `팔로워 ${100 - followerCount}명` : `${100 - followerCount} followers`)
    if (parts.length > 0) return isKo ? `${parts.join(', ')} 더 필요` : `Need ${parts.join(', ')} more for Lv.5`
  }
  return ''
}

export default function ProfileCard({ user, locale, postCount, commentCount, followerCount }: ProfileCardProps) {
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
          const level = getLevel(postCount, commentCount, followerCount)
          const progress = getLevelProgress(postCount, level)
          const unmet = getUnmetCondition(postCount, commentCount, followerCount, isKo)
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
                {unmet ? (
                  <span className="text-orange-400">{unmet}</span>
                ) : level.lv < 5 ? (
                  <span>{level.nextText(isKo)}</span>
                ) : null}
              </div>
            </>
          )
        })()}
      </div>

      {/* 레벨 정보 토글 */}
      <div className="mb-3">
        <details className="group">
          <summary className="cursor-pointer text-xs text-sky-500 hover:text-sky-600 flex items-center gap-1 list-none">
            <span>🏅 레벨 달성 조건 보기</span>
            <span className="group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 bg-gray-50 rounded-xl p-3 flex flex-col gap-1.5 text-xs text-gray-600">
            <div className="flex items-center gap-2"><span>🌱</span><span>Lv.1 새싹 여행자 — 게시글 0개</span></div>
            <div className="flex items-center gap-2"><span>🗺️</span><span>Lv.2 초보 여행자 — 게시글 1~9개</span></div>
            <div className="flex items-center gap-2"><span>✈️</span><span>Lv.3 여행 마니아 — 게시글 10개 + 댓글 50개</span></div>
            <div className="flex items-center gap-2"><span>🏆</span><span>Lv.4 여행 전문가 — 게시글 100개 + 댓글 100개</span></div>
            <div className="flex items-center gap-2"><span>👑</span><span>Lv.5 여행 마스터 — 게시글 500개 + 댓글 100개 + 팔로워 100명</span></div>
          </div>
        </details>
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
