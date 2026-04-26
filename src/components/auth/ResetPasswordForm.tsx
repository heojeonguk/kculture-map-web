'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface ResetPasswordFormProps {
  locale: string
}

export default function ResetPasswordForm({ locale }: ResetPasswordFormProps) {
  const isKo = locale === 'ko'
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async () => {
    if (!email) {
      setError(isKo ? '이메일을 입력해주세요' : 'Please enter your email')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${locale}/auth/update-password`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm text-center">
          <div className="text-5xl mb-4">✉️</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            {isKo ? '메일을 확인해주세요' : 'Check your email'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {isKo
              ? '비밀번호 재설정 링크를 이메일로 보냈습니다'
              : 'We sent a password reset link to your email'}
          </p>
          <Link
            href={`/${locale}/auth/login`}
            className="text-sky-500 text-sm font-medium hover:text-sky-600"
          >
            {isKo ? '로그인으로 돌아가기' : 'Back to login'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">
          <span className="text-red-500">K</span>
          <span className="text-blue-600">culture</span>
          <span className="text-gray-900">-map</span>
        </h1>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          {isKo ? '비밀번호 재설정' : 'Reset Password'}
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          {isKo
            ? '가입한 이메일 주소를 입력하면 재설정 링크를 보내드립니다'
            : 'Enter your email and we\'ll send you a reset link'}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            {isKo ? '이메일' : 'Email'}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleReset()}
            placeholder={isKo ? '이메일 주소' : 'Email address'}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-sky-400 transition-colors"
          />
        </div>

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full bg-sky-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-sky-600 transition-colors disabled:opacity-50"
        >
          {loading
            ? (isKo ? '전송 중...' : 'Sending...')
            : (isKo ? '재설정 링크 보내기' : 'Send Reset Link')}
        </button>

        <p className="text-center text-xs text-gray-500 mt-4">
          <Link
            href={`/${locale}/auth/login`}
            className="text-sky-500 font-medium hover:text-sky-600"
          >
            {isKo ? '← 로그인으로 돌아가기' : '← Back to login'}
          </Link>
        </p>
      </div>
    </div>
  )
}
