/**
 * 사진 프록시 제거됨.
 *
 * 외부 이미지를 서버에서 받아 되보내는 구조는 봇이 장소 카드를 긁을 때마다
 * Fluid Active CPU와 대역폭을 소모했다. 지금은 photo_url이 전체 URL일 때만
 * <img src>에 직접 넣고(@/lib/placePhoto), 그 밖에는 이모지로 표시한다.
 *
 * 배포 전 HTML이 캐시된 클라이언트가 이 경로를 계속 호출할 수 있으므로
 * 라우트 자체는 남겨두되, 외부 fetch 없이 즉시 404로 응답한다.
 */
export function GET() {
  return new Response(null, {
    status: 404,
    headers: {
      // 재호출을 줄이기 위해 404도 길게 캐시한다.
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  })
}
