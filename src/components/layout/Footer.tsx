import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface FooterProps {
  locale: string
}

export default function Footer({ locale }: FooterProps) {
  const t = useTranslations('common')

  return (
    <footer className="border-t border-gray-100 mt-12 py-6">
      <div className="max-w-[1200px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-gray-400">{t('copyright')}</p>
        <div className="flex gap-4">
          <Link href={`/${locale}/terms`} className="text-xs text-gray-400 hover:text-sky-500 transition-colors">
            {t('terms')}
          </Link>
          <Link href={`/${locale}/privacy`} className="text-xs text-gray-400 hover:text-sky-500 transition-colors">
            {t('privacy')}
          </Link>
          <a href="mailto:hellsong90@gmail.com" className="text-xs text-gray-400 hover:text-sky-500 transition-colors">
            {t('contact')}
          </a>
        </div>
      </div>
    </footer>
  )
}
