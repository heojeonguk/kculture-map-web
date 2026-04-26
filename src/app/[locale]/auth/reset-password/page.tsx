import Header from '@/components/layout/Header'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'

interface ResetPasswordPageProps {
  params: Promise<{ locale: string }>
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
