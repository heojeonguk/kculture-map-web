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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="11" fill="white" stroke="#ddd" strokeWidth="0.5"/>
            <path d="M12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12" fill="#CD2E3A"/>
            <path d="M12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17" fill="#003478"/>
            <line x1="5" y1="7.5" x2="8.5" y2="11" stroke="black" strokeWidth="1"/>
            <line x1="6.5" y1="6" x2="10" y2="9.5" stroke="black" strokeWidth="1"/>
            <line x1="5.75" y1="6.75" x2="9.25" y2="10.25" stroke="black" strokeWidth="1"/>
            <line x1="15.5" y1="13" x2="19" y2="16.5" stroke="black" strokeWidth="1"/>
            <line x1="14" y1="14.5" x2="17.5" y2="18" stroke="black" strokeWidth="1"/>
            <line x1="14.75" y1="13.75" x2="18.25" y2="17.25" stroke="black" strokeWidth="1"/>
          </svg>
          <span>K컬처MAP</span>
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
