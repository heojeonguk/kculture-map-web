/**
 * 사진 프록시 제거됨. /api/place-photo와 동일하게 즉시 404로 응답한다.
 * 자세한 배경은 src/app/api/place-photo/route.ts 주석 참고.
 */
export function GET() {
  return new Response(null, {
    status: 404,
    headers: {
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  })
}
