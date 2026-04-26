'use client'

import { useEffect } from 'react'

interface ImageModalProps {
  src: string
  alt?: string
  onClose: () => void
}

export default function ImageModal({ src, alt, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors"
      >
        ✕
      </button>

      {/* 이미지 */}
      <img
        src={src}
        alt={alt ?? ''}
        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
