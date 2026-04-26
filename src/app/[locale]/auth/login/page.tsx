import Header from '@/components/layout/Header'
import LoginForm from '@/components/auth/LoginForm'

interface LoginPageProps {
  params: Promise<{ locale: string }>
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params

  return (
    <>
      <Header locale={locale} />
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <LoginForm locale={locale} />
      </main>
    </>
  )
}
