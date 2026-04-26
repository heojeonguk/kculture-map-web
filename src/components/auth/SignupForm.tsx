'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface SignupFormProps {
  locale: string
}

export default function SignupForm({ locale }: SignupFormProps) {
  const isKo = locale === 'ko'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [nicknameCheck, setNicknameCheck] = useState<'available' | 'taken' | null>(null)
  const [checkingNickname, setCheckingNickname] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)

  const handleNicknameCheck = async () => {
    if (nickname.trim().length < 2) {
      setError(isKo ? '닉네임은 2자 이상이어야 합니다' : 'Nickname must be at least 2 characters')
      return
    }
    setCheckingNickname(true)
    setError('')

    const supabase = createClient()
    const { data } = await supabase
      .from('nicknames')
      .select('nickname')
      .eq('nickname', nickname.trim())
      .maybeSingle()

    setCheckingNickname(false)

    if (data) {
      setNicknameCheck('taken')
    } else {
      setNicknameCheck('available')
    }
  }

  const handleSignup = async () => {
    if (!email || !password || !nickname) {
      setError(isKo ? '모든 항목을 입력해주세요' : 'Please fill in all fields')
      return
    }
    if (nicknameCheck !== 'available') {
      setError(isKo ? '닉네임 중복확인을 해주세요' : 'Please check nickname availability')
      return
    }
    if (!agreeTerms) {
      setError(isKo ? '이용약관 및 개인정보처리방침에 동의해주세요' : 'Please agree to the Terms and Privacy Policy')
      return
    }
    if (password.length < 6) {
      setError(isKo ? '비밀번호는 6자 이상이어야 합니다' : 'Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname },
        emailRedirectTo: `${window.location.origin}/${locale}`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('nicknames').insert({
        user_id: data.user.id,
        nickname: nickname.trim(),
      })
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            {isKo ? '이메일을 확인해주세요!' : 'Check your email!'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {isKo
              ? `${email}로 인증 메일을 보냈습니다. 메일의 링크를 클릭해 인증을 완료해주세요.`
              : `We sent a verification email to ${email}. Click the link to complete registration.`}
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
      {/* 로고 */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">
          <span className="text-red-500">K</span>
          <span className="text-blue-600">culture</span>
          <span className="text-gray-900">-map</span>
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          {isKo ? '회원가입하고 한국 여행을 시작하세요' : 'Join and start your Korea journey'}
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-5">
          {isKo ? '회원가입' : 'Sign Up'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* 닉네임 */}
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            {isKo ? '닉네임' : 'Nickname'} *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => { setNickname(e.target.value); setNicknameCheck(null) }}
              placeholder={isKo ? '2~10자' : '2~10 chars'}
              maxLength={10}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-sky-400 transition-colors"
            />
            <button
              type="button"
              onClick={handleNicknameCheck}
              disabled={checkingNickname}
              className="px-3 py-2.5 border border-sky-400 text-sky-500 rounded-xl text-xs font-medium hover:bg-sky-50 transition-colors disabled:opacity-50 shrink-0"
            >
              {checkingNickname ? '...' : (isKo ? '중복확인' : 'Check')}
            </button>
          </div>
          {nicknameCheck === 'available' && (
            <p className="text-xs text-green-500 mt-1">✅ {isKo ? '사용 가능합니다' : 'Available'}</p>
          )}
          {nicknameCheck === 'taken' && (
            <p className="text-xs text-red-500 mt-1">❌ {isKo ? '이미 사용 중입니다' : 'Already taken'}</p>
          )}
        </div>

        {/* 이메일 */}
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            {isKo ? '이메일' : 'Email'}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isKo ? '이메일 주소' : 'Email address'}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-sky-400 transition-colors"
          />
        </div>

        {/* 비밀번호 */}
        <div className="mb-5">
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            {isKo ? '비밀번호' : 'Password'}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isKo ? '6자 이상' : 'At least 6 characters'}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-sky-400 transition-colors"
          />
        </div>

        {/* 약관 동의 */}
        <div className="flex items-start gap-2 mb-4">
          <input
            type="checkbox"
            id="agreeTerms"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-sky-500 shrink-0"
          />
          <label htmlFor="agreeTerms" className="text-xs text-gray-600 leading-relaxed">
            {isKo ? (
              <>
                <Link href={`/${locale}/terms`} target="_blank" className="text-sky-500 underline">이용약관</Link>
                {' 및 '}
                <Link href={`/${locale}/privacy`} target="_blank" className="text-sky-500 underline">개인정보처리방침</Link>
                에 동의합니다 (필수)
              </>
            ) : (
              <>
                I agree to the{' '}
                <Link href={`/${locale}/terms`} target="_blank" className="text-sky-500 underline">Terms of Service</Link>
                {' and '}
                <Link href={`/${locale}/privacy`} target="_blank" className="text-sky-500 underline">Privacy Policy</Link>
                {' '}(required)
              </>
            )}
          </label>
        </div>

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-sky-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? (isKo ? '처리 중...' : 'Processing...')
            : (isKo ? '회원가입' : 'Sign Up')}
        </button>

        <p className="text-center text-xs text-gray-500 mt-4">
          {isKo ? '이미 계정이 있으신가요?' : 'Already have an account?'}{' '}
          <Link
            href={`/${locale}/auth/login`}
            className="text-sky-500 font-medium hover:text-sky-600"
          >
            {isKo ? '로그인' : 'Login'}
          </Link>
        </p>
      </div>
    </div>
  )
}
