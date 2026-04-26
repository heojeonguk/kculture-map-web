'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface AIRecommendFormProps {
  locale: string
}

const travelStyles = [
  { key: 'food', emoji: '🍽', ko: '미식 여행', en: 'Food Tour' },
  { key: 'culture', emoji: '🏛', ko: '문화/역사', en: 'Culture & History' },
  { key: 'nature', emoji: '🌿', ko: '자연/힐링', en: 'Nature & Healing' },
  { key: 'activity', emoji: '🎯', ko: '액티비티', en: 'Activities' },
  { key: 'shopping', emoji: '🛍', ko: '쇼핑', en: 'Shopping' },
  { key: 'cafe', emoji: '☕', ko: '카페 탐방', en: 'Cafe Hopping' },
]

const durations = [
  { key: '1', ko: '당일치기', en: '1 Day' },
  { key: '2', ko: '1박 2일', en: '2 Days' },
  { key: '3', ko: '2박 3일', en: '3 Days' },
  { key: '5', ko: '4박 5일', en: '5 Days' },
  { key: '7', ko: '일주일+', en: '7 Days+' },
]

const regions = [
  { key: '서울', ko: '서울', en: 'Seoul' },
  { key: '부산', ko: '부산', en: 'Busan' },
  { key: '제주', ko: '제주', en: 'Jeju' },
  { key: '경주', ko: '경주', en: 'Gyeongju' },
  { key: '전국', ko: '전국', en: 'Nationwide' },
]

export default function AIRecommendForm({ locale }: AIRecommendFormProps) {
  const isKo = locale === 'ko'
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [duration, setDuration] = useState('3')
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
      .map(s => travelStyles.find(t => t.key === s)?.[isKo ? 'ko' : 'en'])
      .join(', ')

    const durationLabel = durations.find(d => d.key === duration)?.[isKo ? 'ko' : 'en']
    const regionLabel = regions.find(r => r.key === region)?.[isKo ? 'ko' : 'en']

    const prompt = isKo
      ? `한국 여행 추천을 부탁드립니다.
여행 스타일: ${styleLabels}
여행 기간: ${durationLabel}
희망 지역: ${regionLabel}
${extra ? `추가 요청: ${extra}` : ''}

위 조건에 맞는 구체적인 여행 일정을 추천해주세요. 장소명, 이동 동선, 팁을 포함해서 알려주세요.`
      : `Please recommend a Korea travel itinerary.
Travel style: ${styleLabels}
Duration: ${durationLabel}
Region: ${regionLabel}
${extra ? `Additional requests: ${extra}` : ''}

Please provide a specific travel itinerary including place names, routes, and tips.`

    try {
      const response = await fetch(`${window.location.origin}/api/ai-recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, locale }),
      })

      const data = await response.json()
      setResult(data.result ?? (isKo ? '추천 결과를 가져오지 못했습니다.' : 'Failed to get recommendation.'))
    } catch {
      setResult(isKo ? '오류가 발생했습니다. 다시 시도해주세요.' : 'An error occurred. Please try again.')
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-6 text-white">
        <h1 className="text-xl font-bold mb-1">
          ✨ {isKo ? 'AI 한국 여행 추천' : 'AI Korea Travel Recommendations'}
        </h1>
        <p className="text-sky-100 text-sm">
          {isKo
            ? '여행 스타일과 기간을 선택하면 AI가 맞춤 일정을 추천해드립니다'
            : 'Select your travel style and duration for personalized AI recommendations'}
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-5">

        {/* 여행 스타일 */}
        <div>
          <label className="text-sm font-bold text-gray-800 mb-2 block">
            {isKo ? '여행 스타일 (복수 선택)' : 'Travel Style (multiple)'}
          </label>
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
                {s.emoji} {isKo ? s.ko : s.en}
              </button>
            ))}
          </div>
        </div>

        {/* 여행 기간 */}
        <div>
          <label className="text-sm font-bold text-gray-800 mb-2 block">
            {isKo ? '여행 기간' : 'Duration'}
          </label>
          <div className="flex gap-2 flex-wrap">
            {durations.map((d) => (
              <button
                key={d.key}
                onClick={() => setDuration(duration === d.key ? '' : d.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  duration === d.key
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300'
                }`}
              >
                {isKo ? d.ko : d.en}
              </button>
            ))}
          </div>
        </div>

        {/* 희망 지역 */}
        <div>
          <label className="text-sm font-bold text-gray-800 mb-2 block">
            {isKo ? '희망 지역' : 'Region'}
          </label>
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
                {isKo ? r.ko : r.en}
              </button>
            ))}
          </div>
        </div>

        {/* 추가 요청 */}
        <div>
          <label className="text-sm font-bold text-gray-800 mb-2 block">
            {isKo ? '추가 요청사항 (선택)' : 'Additional requests (optional)'}
          </label>
          <textarea
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder={isKo
              ? '예) 아이와 함께 여행, 예산 절약형, 대중교통만 이용...'
              : 'e.g., traveling with kids, budget-friendly, public transport only...'}
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
              {isKo ? 'AI가 일정을 작성 중...' : 'AI is creating your itinerary...'}
            </span>
          ) : (
            `✨ ${isKo ? 'AI 여행 일정 추천받기' : 'Get AI Travel Recommendations'}`
          )}
        </button>
      </div>

      {/* 결과 */}
      {result && (
        <div className="bg-white border border-sky-100 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center text-xs">✨</span>
            {isKo ? 'AI 추천 여행 일정' : 'AI Travel Itinerary'}
          </h2>
          <div className="prose prose-sm max-w-none text-gray-700">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}
