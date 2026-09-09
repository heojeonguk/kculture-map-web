'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import FollowModal from './FollowModal'
import PlaceRequests from './PlaceRequests'
import { ADMIN_USER_ID } from '@/lib/placeRequest'

interface MyPageClientProps {
  userId: string
  locale: string
  followerCount: number
  followingCount: number
}

export default function MyPageClient({ userId, locale, followerCount, followingCount }: MyPageClientProps) {
  const t = useTranslations('mypage')
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null)

  const isAdmin = userId === ADMIN_USER_ID

  return (
    <>
      <div className="flex items-center gap-4 px-1 text-sm text-gray-500">
        <button
          onClick={() => setFollowModal('followers')}
          className="hover:text-sky-500 transition-colors"
        >
          👥 <span className="font-semibold text-gray-700">{followerCount}</span> {t('followers')}
        </button>
        <span className="text-gray-300">·</span>
        <button
          onClick={() => setFollowModal('following')}
          className="hover:text-sky-500 transition-colors"
        >
          <span className="font-semibold text-gray-700">{followingCount}</span> {t('following')}
        </button>
      </div>

      {/* 관리자에게만 노출: 장소 등록 요청 검토 */}
      {isAdmin && <PlaceRequests locale={locale} />}

      {followModal && (
        <FollowModal
          userId={userId}
          type={followModal}
          locale={locale}
          onClose={() => setFollowModal(null)}
        />
      )}
    </>
  )
}
