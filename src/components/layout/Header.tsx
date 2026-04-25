'use client'

import Link from 'next/link'

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

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center gap-6">
        <Link
          href={`/${locale}`}
          className="text-sky-600 font-bold text-lg flex items-center gap-1 shrink-0"
        >
          🇰🇷 <span>K컬처MAP</span>
        </Link>

        <nav className="flex gap-5 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              className="text-sm text-gray-600 hover:text-sky-600 transition-colors font-medium"
            >
              {isKo ? item.ko : item.en}
            </Link>
          ))}
        </nav>

        <Link
          href={`/${locale}/auth/login`}
          className="text-sm bg-sky-600 text-white px-4 py-1.5 rounded-lg hover:bg-sky-700 transition-colors shrink-0"
        >
          {isKo ? '로그인' : 'Login'}
        </Link>
      </div>
    </header>
  )
}
