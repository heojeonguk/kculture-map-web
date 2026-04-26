'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  locale: string
}

const navItems = [
  { href: '/places', ko: '장소탐색', en: 'Explore' },
  { href: '/community', ko: '커뮤니티', en: 'Community' },
  { href: '/ai-recommend', ko: 'AI추천', en: 'AI Picks' },
]

export default function Header({ locale }: HeaderProps) {
  const isKo = locale === 'ko'
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [nickname, setNickname] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user)
        setNickname(data.user.user_metadata?.nickname ?? data.user.email?.split('@')[0] ?? '')
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        setNickname(session.user.user_metadata?.nickname ?? session.user.email?.split('@')[0] ?? '')
      } else {
        setUser(null)
        setNickname('')
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setMenuOpen(false)
    router.push(`/${locale}`)
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center gap-6">
        <Link href={`/${locale}`} className="flex items-center gap-1 shrink-0">
          <span className="font-black text-lg tracking-tight">
            <span className="text-red-500">K</span>
            <span className="text-blue-600">culture</span>
            <span className="text-gray-900">-map</span>
          </span>
        </Link>

        <nav className="flex gap-5 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              className="text-sm text-gray-600 hover:text-sky-500 transition-colors font-medium"
            >
              {isKo ? item.ko : item.en}
            </Link>
          ))}
        </nav>

        {/* 로그인 상태 */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-sky-500 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-xs font-bold text-sky-600">
                {nickname.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[80px] truncate">{nickname}</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-10 bg-white border border-gray-100 rounded-xl shadow-lg py-1 w-36 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  {isKo ? '로그아웃' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href={`/${locale}/auth/login`}
            className="text-sm bg-sky-500 text-white px-4 py-1.5 rounded-lg hover:bg-sky-600 transition-colors shrink-0"
          >
            {isKo ? '로그인' : 'Login'}
          </Link>
        )}
      </div>
    </header>
  )
}
