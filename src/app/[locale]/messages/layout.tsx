import type { Metadata } from 'next'

interface MessagesLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'ko' ? 'K컬처MAP - 쪽지함' : 'K컄처MAP - Messages',
    robots: { index: false, follow: false },
  }
}

export default function MessagesLayout({ children }: MessagesLayoutProps) {
  return <>{children}</>
}
