// 외부 URL 프록시를 허용할 호스트 (오픈 프록시 방지)
// 현재 컴포넌트는 전체 URL을 프록시 없이 직접 <img src>로 쓴다(@/lib/placePhoto).
// 이 분기는 배포 전 HTML이 캐시된 클라이언트를 위한 하위 호환용이다.
const ALLOWED_HOSTS = [
  'tong.visitkorea.or.kr',
  ...(() => {
    try {
      return [new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname]
    } catch {
      return []
    }
  })(),
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ref = searchParams.get('ref')
  if (!ref) return new Response('Missing ref', { status: 400 })

  // TourAPI 등 외부 이미지 URL (http/https 전체 URL 형식)
  // → 서버에서 그대로 프록시 (referrer 헤더 없이 요청되므로 핫링크 차단도 우회)
  // 신버전 Google API (places/xxx/photos/xxx 형식)
  // 구버전 photo_reference도 호환 처리
  let url: string
  if (ref.startsWith('http://') || ref.startsWith('https://')) {
    let host: string
    try {
      host = new URL(ref).hostname
    } catch {
      return new Response('Invalid ref', { status: 400 })
    }
    if (!ALLOWED_HOSTS.includes(host)) {
      return new Response('Host not allowed', { status: 403 })
    }
    url = ref
  } else if (ref.startsWith('places/')) {
    url = `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=800&key=${process.env.GOOGLE_PLACES_API_KEY}`
  } else {
    url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${process.env.GOOGLE_PLACES_API_KEY}`
  }

  const res = await fetch(url)
  const buffer = await res.arrayBuffer()

  return new Response(buffer, {
    headers: {
      'Content-Type': res.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
