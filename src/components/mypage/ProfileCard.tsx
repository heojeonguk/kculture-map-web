'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ProfileCardProps {
  user: any
  locale: string
}

export default function ProfileCard({ user, locale }: ProfileCardProps) {
  const isKo = locale === 'ko'
  const router = useRouter()
  const nickname = user.user_metadata?.nickname ?? user.email?.split('@')[0] ?? '익명'
  const joinDate = new Date(user.created_at).toLocaleDateString(
    isKo ? 'ko-KR' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${locale}`)
    router.refresh()
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center text-2xl font-bold text-sky-600 shrink-0">
          {nickname.charAt(0).toUpperCase()}
        </div>
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
