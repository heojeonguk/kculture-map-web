'use client'

import { useState } from 'react'

interface Photo {
  id: string
  photo_url: string
  likes_count?: number
}

interface BestPhotosProps {
  photos: Photo[]
  locale: string
}

export default function BestPhotos({ photos, locale }: BestPhotosProps) {
  const isKo = locale === 'ko'
  const [modalSrc, setModalSrc] = useState<string | null>(null)

  return (
    <section>
      <h2 className="text-base font-bold text-gray-800 mb-3">
        📸 {isKo ? '베스트 사진' : 'Best Photos'}
      </h2>

      {photos.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          {isKo ? '사진이 없습니다' : 'No photos yet'}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(photo => (
            <div
              key={photo.id}
              className="relative aspect-square cursor-pointer group"
              onClick={() => setModalSrc(photo.photo_url)}
            >
              <img
                src={photo.photo_url}
                alt=""
                className="w-full h-full object-cover rounded-xl hover:opacity-90 transition-opacity"
              />
              <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                🔥 {photo.likes_count ?? 0}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setModalSrc(null)}
        >
          <button
            onClick={() => setModalSrc(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full bg-black/30"
          >✕</button>
          <img
            src={modalSrc}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  )
}
