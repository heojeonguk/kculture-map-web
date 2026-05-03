import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import SignupForm from '@/components/auth/SignupForm'

interface SignupPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: SignupPageProps): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'ko' ? 'K컬처MAP - 회원가입' : 'K컬처MAP - Sign Up',
    robots: { index: false, follow: false },
  }
}

export default async function SignupPage({ params }: SignupPageProps) {
  const { locale } = await params

  return (
    <>
      <Header locale={locale} />
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <SignupForm locale={locale} />
      </main>
    </>
  )
}
