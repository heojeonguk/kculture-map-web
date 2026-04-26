import Header from '@/components/layout/Header'
import SignupForm from '@/components/auth/SignupForm'

interface SignupPageProps {
  params: Promise<{ locale: string }>
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
