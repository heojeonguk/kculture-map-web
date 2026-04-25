import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'K컬처MAP — Korean Culture Travel Guide',
  description: 'Discover Korea with K컬처MAP. Find restaurants, spots, cafes, shopping, and activities across Korea.',
  openGraph: {
    title: 'K컬처MAP',
    description: 'Korean Culture Travel Guide for Global Travelers',
    url: 'https://www.kculture-map.com',
    siteName: 'K컬처MAP',
    locale: 'en_US',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
