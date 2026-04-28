'use client'

import { useState } from 'react'
import Link from 'next/link'
import FollowModal from './FollowModal'

interface PhotoPost {
  id: string
  photo_url: string
}

interface MyPageClientProps {
  userId: string
  locale: string
  followerCount: number
  followingCount: number
  photoPosts: PhotoPost[]
}

export default function MyPageClient({ userId, locale, followerCount, followingCount, photoPosts }: MyPageClientProps) {
  const isKo = locale === 'ko'
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null)
  const [modalPhoto, setModalPhoto] = useState<string | null>(null)

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

      {/* 사진첩 */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h2 className="text-base font-bold text-gray-800 mb-3">
          📸 {isKo ? '사진첩' : 'Photos'}
        </h2>
        {photoPosts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">{isKo ? '아직 사진이 없습니다' : 'No photos yet'}</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photoPosts.map(post => (
              <div key={post.id} className="relative aspect-square">
                <img
                  src={post.photo_url}
                  alt=""
                  className="w-full h-full object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setModalPhoto(post.photo_url)}
                />
                <Link
                  href={`/${locale}/community/${post.id}`}
                  className="absolute inset-0 rounded-xl"
                  aria-label="게시글 보기"
                  onClick={e => e.stopPropagation()}
                />
              </div>
            ))}
          </div>
        )}
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

      {/* 사진 전체화면 모달 */}
      {modalPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setModalPhoto(null)}
        >
          <button onClick={() => setModalPhoto(null)} className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full bg-black/30">✕</button>
          <img src={modalPhoto} alt="" className="max-w-full max-h-[90vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}
