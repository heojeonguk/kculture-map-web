import Link from 'next/link'

interface FooterProps {
  locale: string
}

export default function Footer({ locale }: FooterProps) {
  const isKo = locale === 'ko'

  return (
    <footer className="border-t border-gray-100 mt-12 py-6">
      <div className="max-w-[1200px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-gray-400">
          © 2026 K컬처MAP. All rights reserved.
        </p>
        <div className="flex gap-4">
          <Link href={`/${locale}/terms`} className="text-xs text-gray-400 hover:text-sky-500 transition-colors">
            {isKo ? '이용약관' : 'Terms'}
          </Link>
          <Link href={`/${locale}/privacy`} className="text-xs text-gray-400 hover:text-sky-500 transition-colors">
            {isKo ? '개인정보처리방침' : 'Privacy'}
          </Link>
          <a href="mailto:hellsong90@gmail.com" className="text-xs text-gray-400 hover:text-sky-500 transition-colors">
            {isKo ? '문의하기' : 'Contact'}
          </a>
        </div>
      </div>
    </footer>
  )
}
