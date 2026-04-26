'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface LoginFormProps {
  locale: string
}

export default function LoginForm({ locale }: LoginFormProps) {
  const isKo = locale === 'ko'
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) {
      setError(isKo ? '이메일과 비밀번호를 입력해주세요' : 'Please enter email and password')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(isKo ? '이메일 또는 비밀번호가 올바르지 않습니다' : 'Invalid email or password')
      setLoading(false)
      return
    }

    router.push(`/${locale}`)
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      {/* 로고 */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">
          <span className="text-red-500">K</span>
          <span className="text-blue-600">culture</span>
          <span className="text-gray-900">-map</span>
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          {isKo ? '로그인하고 한국 여행을 시작하세요' : 'Login to start your Korea journey'}
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-5">
          {isKo ? '로그인' : 'Login'}
        </h2>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* 이메일 */}
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            {isKo ? '이메일' : 'Email'}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder={isKo ? '이메일 주소' : 'Email address'}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-sky-400 transition-colors"
          />
        </div>

        {/* 비밀번호 */}
        <div className="mb-2">
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            {isKo ? '비밀번호' : 'Password'}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder={isKo ? '비밀번호' : 'Password'}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-sky-400 transition-colors"
          />
        </div>

        {/* 비밀번호 찾기 */}
        <div className="text-right mb-4">
          <Link
            href={`/${locale}/auth/reset-password`}
            className="text-xs text-sky-500 hover:text-sky-600"
          >
            {isKo ? '비밀번호를 잊으셨나요?' : 'Forgot password?'}
          </Link>
        </div>

        {/* 로그인 버튼 */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-sky-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? (isKo ? '로그인 중...' : 'Logging in...')
            : (isKo ? '로그인' : 'Login')}
        </button>

        {/* 회원가입 */}
        <p className="text-center text-xs text-gray-500 mt-4">
          {isKo ? '아직 계정이 없으신가요?' : "Don't have an account?"}{' '}
          <Link
            href={`/${locale}/auth/signup`}
            className="text-sky-500 font-medium hover:text-sky-600"
          >
            {isKo ? '회원가입' : 'Sign up'}
          </Link>
        </p>
      </div>
    </div>
  )
}
