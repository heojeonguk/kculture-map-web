'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  locale: string
}

const navItems = [
  { key: 'places', labelEn: 'Explore', labelKo: '장소탐색', href: '/places' },
  { key: 'community', labelEn: 'Community', labelKo: '커뮤니티', href: '/community' },
  { key: 'ai', labelEn: 'AI Recommend', labelKo: 'AI추천', href: '/ai-recommend' },
]

export default function Header({ locale }: HeaderProps) {
  const isKo = locale === 'ko'

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center gap-6">
        <Link href={`/${locale}`} className="text-emerald-600 font-bold text-lg">
          🗺 K컬처MAP
        </Link>

        <nav className="flex gap-4 flex-1">
          {navItems.map(item => (
            <Link
              key={item.key}
              href={`/${locale}${item.href}`}
              className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
            >
              {isKo ? item.labelKo : item.labelEn}
            </Link>
          ))}
        </nav>

        <Link
          href={`/${locale}/auth/login`}
          className="text-sm bg-emerald-600 text-white px-4 py-1.5 rounded-md hover:bg-emerald-700 transition-colors"
        >
          {isKo ? '로그인' : 'Login'}
        </Link>
      </div>
    </header>
  )
}
