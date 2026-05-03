import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'

interface ResetPasswordPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: ResetPasswordPageProps): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'ko' ? 'K컬처MAP - 비밀번호 재설정' : 'K컬처MAP - Reset Password',
    robots: { index: false, follow: false },
  }
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { locale } = await params

  return (
    <>
      <Header locale={locale} />
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <ResetPasswordForm locale={locale} />
      </main>
    </>
  )
}
