/**
 * places.photo_url 값을 <img src>로 변환한다.
 *
 * photo_url에는 세 가지 형식이 섞여 있다:
 *  1. 전체 URL (TourAPI `tong.visitkorea.or.kr`, Supabase Storage 등)
 *     → 그대로 사용. 프록시를 태우면 서버 대역폭만 쓰고 이득이 없다.
 *  2. Google Places API (신버전) `places/xxx/photos/xxx`
 *     → API 키가 필요하므로 /api/place-photo 프록시 경유.
 *  3. Google Places API (구버전) 순수 photo_reference 문자열
 *     → 동일하게 프록시 경유.
 */
export function placePhotoSrc(photoUrl: string): string {
  if (/^https?:\/\//i.test(photoUrl)) return photoUrl
  return `/api/place-photo?ref=${encodeURIComponent(photoUrl)}`
}
