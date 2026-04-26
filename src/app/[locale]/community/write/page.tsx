import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import PostWriteForm from '@/components/community/PostWriteForm'

interface WritePageProps {
  params: Promise<{ locale: string }>
}

export default async function WritePage({ params }: WritePageProps) {
  const { locale } = await params

  return (
    <>
      <Header locale={locale} />
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid grid-cols-[160px_1fr_160px] gap-6">
          <Sidebar position="left" />
          <div className="min-w-0">
            <PostWriteForm locale={locale} />
          </div>
          <Sidebar position="right" />
        </div>
      </main>
    </>
  )
}
