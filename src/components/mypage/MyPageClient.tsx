'use client'

import { useState } from 'react'
import FollowModal from './FollowModal'

interface MyPageClientProps {
  userId: string
  locale: string
  followerCount: number
  followingCount: number
}

export default function MyPageClient({ userId, locale, followerCount, followingCount }: MyPageClientProps) {
  const isKo = locale === 'ko'
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null)

  return (
    <>
      {/* 팔로워/팔로잉 */}
      <div className="flex items-center gap-4 px-1 text-sm text-gray-500">
        <button
          onClick={() => setFollowModal('followers')}
          className="hover:text-sky-500 transition-colors"
        >
          👥 <span className="font-semibold text-gray-700">{followerCount}</span> {isKo ? '팔로워' : 'followers'}
        </button>
        <span className="text-gray-300">·</span>
        <button
          onClick={() => setFollowModal('following')}
          className="hover:text-sky-500 transition-colors"
        >
          <span className="font-semibold text-gray-700">{followingCount}</span> {isKo ? '팔로잉' : 'following'}
        </button>
      </div>

      {/* 팔로워/팔로잉 모달 */}
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
