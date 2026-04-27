'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ProfileCardProps {
  user: any
  locale: string
}

export default function ProfileCard({ user, locale }: ProfileCardProps) {
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
