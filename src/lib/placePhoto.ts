/**
 * places.photo_url 값을 <img src>로 변환한다.
 *
 * 전체 URL(http/https)만 그대로 사용하고, 그 밖의 값은 null을 돌려준다.
 * 호출하는 쪽은 null이면 이모지 fallback을 보여준다.
 *
 * 과거에는 Google Places의 photo_reference를 /api/place-photo 프록시로
 * 중계했지만, 봇이 장소 카드를 긁을 때마다 서버가 외부 이미지를
 * 받아서 되보내는 구조라 CPU·대역폭을 크게 소모했다.
 * 프록시를 제거하는 대신 사진이 없는 장소는 이모지로 표시한다.
 */
export function placePhotoSrc(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) return null
  return /^https?:\/\//i.test(photoUrl) ? photoUrl : null
}
