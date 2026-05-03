'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NotificationBell from '@/components/common/NotificationBell'

interface HeaderProps {
  locale: string
}

const languages = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'th', label: 'ภาษาไทย' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'ms', label: 'Bahasa Melayu' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'ar', label: 'العربية' },
]

function localeDisplayCode(locale: string): string {
  if (locale === 'zh-CN') return 'CN'
  if (locale === 'zh-TW') return 'TW'
  return locale.slice(0, 2).toUpperCase()
}

export default function Header({ locale }: HeaderProps) {
  const t = useTranslations('nav')
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [nickname, setNickname] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const navItems = [
    { href: '/places', label: t('explore') },
    { href: '/community', label: t('community') },
    { href: '/ai-recommend', label: t('aiRecommend') },
  ]

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) setMobileMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLocaleChange = (newLocale: string) => {
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
    setLangOpen(false)
    setMobileMenuOpen(false)
  }

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
      <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center gap-3 sm:gap-6">
        <Link href={`/${locale}`} className="flex items-center gap-1 shrink-0">
          <span className="font-black text-lg tracking-tight">
            <span className="text-red-500">K</span>
            <span className="text-blue-600">culture</span>
            <span className="text-gray-900">-map</span>
          </span>
        </Link>

        {/* 데스크톱 nav */}
        <nav className="hidden md:flex gap-5 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              className="text-sm text-gray-600 hover:text-sky-500 transition-colors font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 언어 선택 */}
        <div className="relative shrink-0 ml-auto" ref={langRef}>
          <button
            onClick={() => setLangOpen(prev => !prev)}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-sky-500 border border-gray-200 hover:border-sky-300 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            🌐<span className="hidden sm:inline ml-0.5">{localeDisplayCode(locale)}</span>
          </button>

          {langOpen && (
            <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-44 max-h-64 overflow-y-auto py-1">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleLocaleChange(lang.code)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                    locale === lang.code
                      ? 'text-sky-600 bg-sky-50 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{lang.label}</span>
                  {locale === lang.code && <span className="text-sky-500 text-xs">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {user ? (
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link
              href={`/${locale}/messages`}
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="쪽지함"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-sky-500 transition-colors"
              >
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={nickname}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-xs font-bold text-sky-600">
                    {nickname.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline max-w-[80px] truncate">{nickname}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-10 bg-white border border-gray-100 rounded-xl shadow-lg py-1 w-36 z-50">
                  <Link
                    href={`/${locale}/mypage`}
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    👤 {t('myPage')}
                  </Link>
                  <Link
                    href={`/${locale}/community/write`}
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    ✏️ {t('write')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    🚪 {t('logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link
            href={`/${locale}/auth/login`}
            className="text-sm bg-sky-500 text-white px-4 py-1.5 rounded-lg hover:bg-sky-600 transition-colors shrink-0"
          >
            {t('login')}
          </Link>
        )}

        {/* 모바일 햄버거 버튼 */}
        <div className="relative md:hidden" ref={mobileMenuRef}>
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="p-1.5 text-gray-600 hover:text-sky-500 transition-colors"
            aria-label="메뉴 열기"
          >
            {mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {mobileMenuOpen && (
            <div className="absolute right-0 top-10 bg-white border border-gray-100 rounded-xl shadow-lg z-50 w-52 py-1">
              {/* 네비게이션 링크 */}
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-sky-500 transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ))}

              {/* 언어 선택 */}
              <div className="border-t border-gray-100 mt-1 pt-1">
                <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Language</p>
                <div className="max-h-48 overflow-y-auto">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => handleLocaleChange(lang.code)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                        locale === lang.code
                          ? 'text-sky-600 bg-sky-50 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{lang.label}</span>
                      {locale === lang.code && <span className="text-sky-500 text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
