'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useTranslations } from 'next-intl'

interface AIRecommendFormProps {
  locale: string
}

const travelStyles = [
  { key: 'food', emoji: '🍽' },
  { key: 'culture', emoji: '🏛' },
  { key: 'nature', emoji: '🌿' },
  { key: 'activity', emoji: '🎯' },
  { key: 'shopping', emoji: '🛍' },
  { key: 'cafe', emoji: '☕' },
]

const durations = ['day', '1n2d', '2n3d', '4n5d', 'week'] as const

const regions = [
  { key: '서울', regionKey: 'seoul' },
  { key: '부산', regionKey: 'busan' },
  { key: '제주', regionKey: 'jeju' },
  { key: '경기', regionKey: 'gyeonggi' },
  { key: '인천', regionKey: 'incheon' },
  { key: '강원', regionKey: 'gangwon' },
  { key: '경상', regionKey: 'gyeongSang' },
  { key: '전라', regionKey: 'jeolla' },
  { key: '충청', regionKey: 'chungcheong' },
]

export default function AIRecommendForm({ locale }: AIRecommendFormProps) {
  const t = useTranslations('ai')
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [duration, setDuration] = useState<typeof durations[number]>('2n3d')
  const [region, setRegion] = useState('서울')
  const [extra, setExtra] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const toggleStyle = (key: string) => {
    setSelectedStyles(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    )
  }

  const handleSubmit = async () => {
    if (selectedStyles.length === 0) return
    setLoading(true)
    setResult('')

    const styleLabels = selectedStyles
      .map(s => {
        const style = travelStyles.find(ts => ts.key === s)
        return style ? `${style.emoji} ${t(`styles.${s}`)}` : s
      })
      .join(', ')

    const durationLabel = t(`durations.${duration}`)
    const regionObj = regions.find(r => r.key === region)
    const regionLabel = regionObj ? t(`regions.${regionObj.regionKey}`) : region

    const prompt = [
      `${t('style')}: ${styleLabels}`,
      `${t('duration')}: ${durationLabel}`,
      `${t('region')}: ${regionLabel}`,
      extra ? `${t('extra')}: ${extra}` : null,
    ].filter(Boolean).join('\n')

    try {
      const response = await fetch(`${window.location.origin}/api/ai-recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, locale }),
      })

      const data = await response.json()
      setResult(data.result ?? t('errorResult'))
    } catch {
      setResult(t('errorGeneral'))
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-6 text-white">
        <h1 className="text-xl font-bold mb-1">✨ {t('title')}</h1>
        <p className="text-sky-100 text-sm">{t('subtitle')}</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-5">

        {/* 여행 스타일 */}
        <div>
          <label className="text-sm font-bold text-gray-800 mb-2 block">{t('style')}</label>
          <div className="flex gap-2 flex-wrap">
            {travelStyles.map((s) => (
              <button
                key={s.key}
                onClick={() => toggleStyle(s.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  selectedStyles.includes(s.key)
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300'
                }`}
              >
                {s.emoji} {t(`styles.${s.key}`)}
              </button>
            ))}
          </div>
        </div>

        {/* 여행 기간 */}
        <div>
          <label className="text-sm font-bold text-gray-800 mb-2 block">{t('duration')}</label>
          <div className="flex gap-2 flex-wrap">
            {durations.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(duration === d ? '2n3d' : d)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  duration === d
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300'
                }`}
              >
                {t(`durations.${d}`)}
              </button>
            ))}
          </div>
        </div>

        {/* 희망 지역 */}
        <div>
          <label className="text-sm font-bold text-gray-800 mb-2 block">{t('region')}</label>
          <div className="flex gap-2 flex-wrap">
            {regions.map((r) => (
              <button
                key={r.key}
                onClick={() => setRegion(region === r.key ? '' : r.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  region === r.key
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300'
                }`}
              >
                {t(`regions.${r.regionKey}`)}
              </button>
            ))}
          </div>
        </div>

        {/* 추가 요청 */}
        <div>
          <label className="text-sm font-bold text-gray-800 mb-2 block">{t('extra')}</label>
          <textarea
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder={t('extraPlaceholder')}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-sky-400 transition-colors resize-none"
          />
        </div>

        {/* 추천 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={loading || selectedStyles.length === 0}
          className="w-full py-3 bg-sky-500 text-white rounded-xl text-sm font-medium hover:bg-sky-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('loading')}
            </span>
          ) : (
            `✨ ${t('button')}`
          )}
        </button>
      </div>

      {result && (
        <div className="bg-white border border-sky-100 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center text-xs">✨</span>
            {t('resultTitle')}
          </h2>
          <div className="prose prose-sm max-w-none text-gray-700">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}
