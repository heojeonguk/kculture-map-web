import Header from '@/components/layout/Header'

interface PrivacyPageProps {
  params: Promise<{ locale: string }>
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params
  const isKo = locale === 'ko'

  return (
    <>
      <Header locale={locale} />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isKo ? '개인정보처리방침' : 'Privacy Policy'}
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          {isKo ? '최종 업데이트: 2026년 4월' : 'Last updated: April 2026'}
        </p>

        <div className="flex flex-col gap-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3">
              {isKo ? '1. 수집하는 개인정보 항목' : '1. Personal Information Collected'}
            </h2>
            <p className="mb-2">
              {isKo ? 'K컬처MAP은 다음의 개인정보를 수집합니다:' : 'K컬처MAP collects the following personal information:'}
            </p>
            <ul className="list-disc list-inside flex flex-col gap-1.5 text-gray-600">
              <li>{isKo ? '이메일 주소 (회원가입 및 로그인)' : 'Email address (for registration and login)'}</li>
              <li>{isKo ? '닉네임 (서비스 내 활동명)' : 'Nickname (display name within the service)'}</li>
              <li>{isKo ? '게시글 및 댓글 내용' : 'Posts and comments content'}</li>
              <li>{isKo ? '서비스 이용 기록, 접속 로그' : 'Service usage records and access logs'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3">
              {isKo ? '2. 개인정보 수집 목적' : '2. Purpose of Collection'}
            </h2>
            <ul className="list-disc list-inside flex flex-col gap-1.5 text-gray-600">
              <li>{isKo ? '회원 식별 및 서비스 제공' : 'Member identification and service provision'}</li>
              <li>{isKo ? '커뮤니티 서비스 운영' : 'Community service operations'}</li>
              <li>{isKo ? '서비스 개선 및 통계 분석' : 'Service improvement and statistical analysis'}</li>
              <li>{isKo ? '불법 이용 방지 및 분쟁 해결' : 'Prevention of illegal use and dispute resolution'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3">
              {isKo ? '3. 개인정보 보유 및 이용 기간' : '3. Retention Period'}
            </h2>
            <p>
              {isKo
                ? '회원 탈퇴 시 개인정보는 즉시 삭제됩니다. 단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관됩니다.'
                : 'Personal information is deleted immediately upon withdrawal. However, information may be retained as required by applicable laws.'}
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3">
              {isKo ? '4. 개인정보의 제3자 제공' : '4. Third-Party Sharing'}
            </h2>
            <p>
              {isKo
                ? 'K컬처MAP은 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다. 다만, 이용자의 동의가 있거나 법령의 규정에 의한 경우는 예외로 합니다.'
                : 'K컬처MAP does not share personal information with third parties without consent, except as required by law.'}
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3">
              {isKo ? '5. 개인정보 보호 조치' : '5. Security Measures'}
            </h2>
            <p>
              {isKo
                ? 'K컬처MAP은 Supabase를 통해 데이터를 안전하게 관리하며, 비밀번호는 암호화하여 저장합니다. 개인정보에 대한 접근은 최소한의 인원으로 제한합니다.'
                : 'K컬처MAP securely manages data through Supabase. Passwords are encrypted, and access to personal information is limited to authorized personnel.'}
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3">
              {isKo ? '6. 이용자의 권리' : '6. User Rights'}
            </h2>
            <p>
              {isKo
                ? '이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제할 수 있습니다. 개인정보 관련 문의는 아래 연락처로 문의해 주세요.'
                : 'Users may access, modify, or delete their personal information at any time. For inquiries, please contact us below.'}
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3">
              {isKo ? '7. 개인정보 처리방침 변경' : '7. Changes to Privacy Policy'}
            </h2>
            <p>
              {isKo
                ? '본 방침은 법령 및 서비스 변경사항을 반영하기 위해 수정될 수 있으며, 변경 시 서비스 내 공지사항을 통해 안내합니다.'
                : 'This policy may be updated to reflect changes in law or service. Changes will be announced through the Service.'}
            </p>
          </section>

          <section className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500">
              {isKo
                ? '개인정보 처리에 관한 문의: hellsong90@gmail.com'
                : 'Privacy inquiries: hellsong90@gmail.com'}
            </p>
          </section>

        </div>
      </main>
    </>
  )
}
