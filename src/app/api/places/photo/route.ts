export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ref = searchParams.get('ref')
  if (!ref) return new Response('Missing ref', { status: 400 })

  const url = `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=800&key=${process.env.GOOGLE_PLACES_API_KEY}`
  const res = await fetch(url)
  const buffer = await res.arrayBuffer()

  return new Response(buffer, {
    headers: {
      'Content-Type': res.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400', // 1일 캐시
    },
  })
}
