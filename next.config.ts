import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zmukgjwddorgprxzqlka.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // i18n은 App Router에서 middleware로 처리
}

export default nextConfig
