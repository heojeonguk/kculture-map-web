export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ref = searchParams.get('ref')
  if (!ref) return new Response('Missing ref', { status: 400 })

  // 신버전 API (places/xxx/photos/xxx 형식)
  // 구버전 photo_reference도 호환 처리
  let url: string
  if (ref.startsWith('places/')) {
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
