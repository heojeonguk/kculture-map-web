import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { routing } from '@/routing'

/**
 * locale 세그먼트 15개만 고정한다.
 *
 * Next.js 16은 generateStaticParams가 하나도 없는 동적 세그먼트를
 * ISR 대상으로 등록하지 않고 전부 요청마다 렌더한다(prerender-manifest의
 * dynamicRoutes가 비게 된다). 즉 locale 경로를 캐시하려면 이 선언이 필요하다.
 *
 * 여기서 만드는 페이지는 라우트당 15개(= 언어 수)뿐이다.
 * 장소/게시글 상세는 각 page.tsx에서 빈 배열을 돌려주므로
 * 빌드 시 수만 페이지가 생성되지 않는다.
 */
export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // next-intl의 서버 API는 기본적으로 headers()를 읽어 동적 렌더링을 유발한다.
  // locale을 미리 주입해야 페이지가 ISR로 캐시될 수 있다.
  setRequestLocale(locale)
  const messages = await getMessages()
  return (
    <div lang={locale}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </div>
  )
}
