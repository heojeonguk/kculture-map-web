'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { placePhotoSrc } from '@/lib/placePhoto'
import { CATEGORY_EMOJI, RequestCategory, PlaceRequestRow } from '@/lib/placeRequest'

interface PlaceRequestsProps {
  locale: string
}

export default function PlaceRequests({ locale }: PlaceRequestsProps) {
  const t = useTranslations('placeRequest')
  const tCategory = useTranslations('category')

  const [requests, setRequests] = useState<PlaceRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${window.location.origin}/api/place-requests?status=pending`)
      if (!res.ok) {
        setRequests([])
        setLoading(false)
        return
      }
      setRequests(await res.json())
    } catch {
      setRequests([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const act = async (id: string, action: 'approve' | 'reject') => {
    if (actingId) return
    setActingId(id)
    setError('')
    try {
      const res = await fetch(`${window.location.origin}/api/place-requests/${id}/${action}`, {
        method: 'POST',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(body?.error ?? t('errorAction'))
        setActingId(null)
        return
      }
      // 처리된 요청은 pending 목록에서 제거
      setRequests((prev) => prev.filter((r) => r.id !== id))
    } catch {
      setError(t('errorAction'))
    }
    setActingId(null)
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center justify-center py-6">
          <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <h2 className="text-base font-bold text-gray-800 mb-1">
        📮 {t('adminTitle')}{' '}
        <span className="text-sky-500">{requests.length}</span>
      </h2>
      <p className="text-xs text-gray-400 mb-4">{t('adminSubtitle')}</p>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">{t('adminEmpty')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((req) => (
            <div key={req.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {CATEGORY_EMOJI[req.category as RequestCategory] ?? '📍'} {req.name}
                    {req.name_en && (
                      <span className="text-gray-400 font-normal"> · {req.name_en}</span>
                    )}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {tCategory(req.category)} · {req.city} ·{' '}
                    {new Date(req.created_at).toLocaleDateString(locale)}
                  </p>
                </div>
              </div>

              <dl className="text-xs text-gray-600 flex flex-col gap-1 mb-3">
                <div className="flex gap-2">
                  <dt className="text-gray-400 shrink-0 w-16">{t('address')}</dt>
                  <dd className="min-w-0 break-words">{req.address}</dd>
                </div>
                {req.phone && (
                  <div className="flex gap-2">
                    <dt className="text-gray-400 shrink-0 w-16">{t('phone')}</dt>
                    <dd>{req.phone}</dd>
                  </div>
                )}
                {req.hours && (
                  <div className="flex gap-2">
                    <dt className="text-gray-400 shrink-0 w-16">{t('hours')}</dt>
                    <dd>{req.hours}</dd>
                  </div>
                )}
                {req.website && (
                  <div className="flex gap-2">
                    <dt className="text-gray-400 shrink-0 w-16">{t('website')}</dt>
                    <dd className="min-w-0 break-all">
                      <a
                        href={req.website}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-sky-500 hover:underline"
                      >
                        {req.website}
                      </a>
                    </dd>
                  </div>
                )}
                {req.description && (
                  <div className="flex gap-2">
                    <dt className="text-gray-400 shrink-0 w-16">{t('description')}</dt>
                    <dd className="min-w-0 break-words whitespace-pre-wrap">{req.description}</dd>
                  </div>
                )}
                <div className="flex gap-2">
                  <dt className="text-gray-400 shrink-0 w-16">{t('requester')}</dt>
                  <dd className="min-w-0 break-all">
                    {req.requester_name ? `${req.requester_name} · ` : ''}
                    {req.requester_email}
                  </dd>
                </div>
              </dl>

              {req.photo_urls && req.photo_urls.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {req.photo_urls.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-lg overflow-hidden bg-gray-50 block"
                    >
                      <img
                        src={placePhotoSrc(url)}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => act(req.id, 'approve')}
                  disabled={actingId !== null}
                  className="flex-1 py-2 bg-sky-500 text-white rounded-xl text-xs font-medium hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actingId === req.id ? t('processing') : t('approve')}
                </button>
                <button
                  onClick={() => act(req.id, 'reject')}
                  disabled={actingId !== null}
                  className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('reject')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
