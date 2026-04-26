'use client'

import { useState } from 'react'
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

  const [editing, setEditing] = useState(false)
  const [newNickname, setNewNickname] = useState(nickname)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    const trimmed = newNickname.trim()
    if (trimmed.length < 2) {
      setError(isKo ? '닉네임은 2자 이상이어야 합니다' : 'Nickname must be at least 2 characters')
      return
    }
    if (trimmed === nickname) {
      setError(isKo ? '현재 닉네임과 동일합니다' : 'Same as current nickname')
      return
    }

    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      data: { nickname: trimmed }
    })

    if (updateError) {
      setError(isKo ? '저장에 실패했습니다' : 'Failed to save')
      setSaving(false)
      return
    }

    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  const handleCancel = () => {
    setEditing(false)
    setNewNickname(nickname)
    setError('')
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
        {/* 아바타 */}
        <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center text-2xl font-bold text-sky-600 shrink-0">
          {nickname.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1">
          {editing ? (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNickname}
                  onChange={(e) => { setNewNickname(e.target.value); setError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  maxLength={10}
                  placeholder={isKo ? '2~10자' : '2~10 chars'}
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-sky-400"
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-1.5 bg-sky-500 text-white rounded-lg text-xs font-medium hover:bg-sky-600 transition-colors disabled:opacity-50"
                >
                  {saving ? '...' : (isKo ? '저장' : 'Save')}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  {isKo ? '취소' : 'Cancel'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-800">{nickname}</h2>
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-sky-500 hover:text-sky-600 transition-colors"
              >
                ✏️ {isKo ? '수정' : 'Edit'}
              </button>
            </div>
          )}
          <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
        </div>
      </div>

      {/* 정보 */}
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

      {/* 로그아웃 */}
      <button
        onClick={handleLogout}
        className="w-full py-2 border border-red-100 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
      >
        {isKo ? '로그아웃' : 'Logout'}
      </button>
    </div>
  )
}
