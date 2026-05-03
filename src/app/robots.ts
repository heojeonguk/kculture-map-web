import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/*/mypage',
        '/*/messages',
        '/*/auth/',
      ],
    },
    sitemap: 'https://www.kculture-map.com/sitemap.xml',
  }
}
