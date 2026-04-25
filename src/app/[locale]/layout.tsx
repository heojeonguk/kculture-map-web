import { locales } from '@/middleware'

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  return (
    <div lang={params.locale}>
      {children}
    </div>
  )
}
