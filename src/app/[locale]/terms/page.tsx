import Header from '@/components/layout/Header'

interface TermsPageProps {
  params: Promise<{ locale: string }>
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params
  const isKo = locale === 'ko'

  return (
    <>
      <Header locale={locale} />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isKo ? '이용약관' : 'Terms of Service'}
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          {isKo ? '최종 업데이트: 2026년 4월' : 'Last updated: April 2026'}
        </p>

        <div className="flex flex-col gap-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3">
              {isKo ? '제1조 (목적)' : 'Article 1 (Purpose)'}
            </h2>
            <p>
              {isKo
                ? 'K컬처MAP(이하 "서비스")의 이용약관은 서비스 이용자가 서비스를 이용함에 있어 필요한 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.'
                : 'These Terms of Service govern your use of K컬처MAP (the "Service") and describe the rights, obligations, and responsibilities of users.'}
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3">
              {isKo ? '제2조 (서비스 이용)' : 'Article 2 (Use of Service)'}
            </h2>
            <p>
              {isKo
                ? '서비스는 한국을 여행하는 외국인을 위한 문화 여행 가이드 플랫폼입니다. 이용자는 서비스를 통해 장소 탐색, 커뮤니티 참여, AI 여행 추천 등의 기능을 이용할 수 있습니다.'
                : 'The Service is a cultural travel guide platform for international visitors to Korea. Users can explore places, participate in the community, and receive AI travel recommendations.'}
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3">
              {isKo ? '제3조 (회원가입)' : 'Article 3 (Registration)'}
            </h2>
            <p>
              {isKo
                ? '이용자는 서비스에서 제공하는 양식에 따라 회원정보를 기입하고 본 약관에 동의함으로써 회원가입을 신청할 수 있습니다. 닉네임은 가입 이후 변경이 불가능하므로 신중하게 선택하시기 바랍니다.'
                : 'Users may register by completing the registration form and agreeing to these Terms. Nicknames cannot be changed after registration, so please choose carefully.'}
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3">
              {isKo ? '제4조 (이용자의 의무)' : 'Article 4 (User Obligations)'}
            </h2>
            <p className="mb-2">
              {isKo ? '이용자는 다음 행위를 해서는 안 됩니다:' : 'Users must not:'}
            </p>
            <ul className="list-disc list-inside flex flex-col gap-1.5 text-gray-600">
              <li>{isKo ? '타인의 정보 도용 및 허위 정보 등록' : 'Steal others\' information or register false information'}</li>
              <li>{isKo ? '서비스 운영을 방해하는 행위' : 'Interfere with service operations'}</li>
              <li>{isKo ? '음란, 폭력적인 게시물 등록' : 'Post obscene or violent content'}</li>
              <li>{isKo ? '상업적 광고 및 스팸 행위' : 'Post commercial advertisements or spam'}</li>
              <li>{isKo ? '타인의 명예를 훼손하는 행위' : 'Defame or harm others'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3">
              {isKo ? '제5조 (서비스 제공의 중단)' : 'Article 5 (Service Interruption)'}
            </h2>
            <p>
              {isKo
                ? '서비스는 시스템 점검, 업그레이드, 천재지변 등의 사유로 서비스 제공이 일시적으로 중단될 수 있으며, 이에 대해 서비스는 사전 공지를 통해 이용자에게 안내합니다.'
                : 'The Service may be temporarily interrupted due to system maintenance, upgrades, or force majeure. Users will be notified in advance whenever possible.'}
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3">
              {isKo ? '제6조 (면책조항)' : 'Article 6 (Disclaimer)'}
            </h2>
            <p>
              {isKo
                ? '서비스는 이용자가 게재한 정보, 자료, 사실의 신뢰도, 정확성 등에 대해서 책임을 지지 않습니다. 서비스는 이용자 간 또는 이용자와 제3자 간에 서비스를 매개로 발생한 분쟁에 대해 개입할 의무가 없습니다.'
                : 'The Service is not responsible for the reliability or accuracy of information posted by users. The Service has no obligation to intervene in disputes between users or between users and third parties.'}
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3">
              {isKo ? '제7조 (약관의 변경)' : 'Article 7 (Changes to Terms)'}
            </h2>
            <p>
              {isKo
                ? '서비스는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 공지합니다. 변경된 약관에 동의하지 않는 경우 이용자는 서비스 이용을 중단하고 탈퇴할 수 있습니다.'
                : 'The Service may update these Terms at any time. Changes will be announced through the Service. If you disagree with the changes, you may discontinue use and withdraw your membership.'}
            </p>
          </section>

          <section className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500">
              {isKo
                ? '문의사항이 있으시면 hellsong90@gmail.com으로 연락해 주세요.'
                : 'If you have any questions, please contact us at hellsong90@gmail.com.'}
            </p>
          </section>

        </div>
      </main>
    </>
  )
}
