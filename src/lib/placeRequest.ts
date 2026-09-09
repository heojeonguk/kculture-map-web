// 장소 등록 요청 기능의 공용 상수/검증 로직 (서버·클라이언트 양쪽에서 사용)

export const ADMIN_USER_ID = '8539a28e-95be-4893-b192-8542ac30a95c'

export const REQUEST_CATEGORIES = ['food', 'cafe', 'spot', 'shopping', 'activity'] as const
export type RequestCategory = (typeof REQUEST_CATEGORIES)[number]

// PlaceFilter/PostWriteForm과 동일한 지역 목록 (DB에는 한글 값이 저장됨)
export const REQUEST_CITIES: { key: string; regionKey: string }[] = [
  { key: '서울', regionKey: 'seoul' },
  { key: '부산', regionKey: 'busan' },
  { key: '제주', regionKey: 'jeju' },
  { key: '경기', regionKey: 'gyeonggi' },
  { key: '인천', regionKey: 'incheon' },
  { key: '강원', regionKey: 'gangwon' },
  { key: '경상', regionKey: 'gyeongSang' },
  { key: '전라', regionKey: 'jeolla' },
  { key: '충청', regionKey: 'chungcheong' },
]

export const CATEGORY_EMOJI: Record<RequestCategory, string> = {
  food: '🍽️',
  cafe: '☕',
  spot: '📍',
  shopping: '🛍️',
  activity: '🎯',
}

export const MAX_PHOTOS = 5
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const ALLOWED_PHOTO_EXTS = ['jpg', 'jpeg', 'png', 'webp']
export const MAX_DESCRIPTION_LENGTH = 500

export const REQUEST_STATUSES = ['pending', 'approved', 'rejected'] as const
export type RequestStatus = (typeof REQUEST_STATUSES)[number]

export interface PlaceRequestRow {
  id: string
  name: string
  name_en: string | null
  category: string
  city: string
  address: string
  phone: string | null
  hours: string | null
  website: string | null
  description: string | null
  photo_urls: string[] | null
  requester_email: string
  requester_name: string | null
  user_id: string | null
  status: string
  admin_note: string | null
  created_at: string
  reviewed_at: string | null
}

export interface PlaceRequestInput {
  name: string
  name_en?: string | null
  category: string
  city: string
  address: string
  phone?: string | null
  hours?: string | null
  website?: string | null
  description?: string | null
  photo_urls?: string[] | null
  requester_email: string
  requester_name?: string | null
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLength)
}

/**
 * 요청 페이로드를 검증하고 DB에 넣을 형태로 정규화한다.
 *
 * 이 경로는 service_role로 INSERT하므로 RLS의 보호를 받지 않는다.
 * 검증을 여기서 끝내야 한다.
 */
export function validatePlaceRequest(
  body: unknown
): { ok: true; value: PlaceRequestInput } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid body' }
  }
  const b = body as Record<string, unknown>

  const name = cleanText(b.name, 120)
  if (!name) return { ok: false, error: 'name is required' }

  const category = typeof b.category === 'string' ? b.category : ''
  if (!(REQUEST_CATEGORIES as readonly string[]).includes(category)) {
    return { ok: false, error: 'invalid category' }
  }

  const city = typeof b.city === 'string' ? b.city : ''
  if (!REQUEST_CITIES.some((c) => c.key === city)) {
    return { ok: false, error: 'invalid city' }
  }

  const address = cleanText(b.address, 300)
  if (!address) return { ok: false, error: 'address is required' }

  const requesterEmail = cleanText(b.requester_email, 254)
  if (!requesterEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requesterEmail)) {
    return { ok: false, error: 'valid requester_email is required' }
  }

  // 웹사이트는 http/https만 허용 (javascript: 등 차단)
  let website: string | null = cleanText(b.website, 500)
  if (website) {
    const withScheme = /^https?:\/\//i.test(website) ? website : `https://${website}`
    try {
      const parsed = new URL(withScheme)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { ok: false, error: 'invalid website' }
      }
      website = parsed.toString()
    } catch {
      return { ok: false, error: 'invalid website' }
    }
  }

  // 업로드된 사진 URL은 우리 Supabase Storage 것만 허용
  let photoUrls: string[] | null = null
  if (Array.isArray(b.photo_urls)) {
    const supabaseHost = (() => {
      try {
        return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname
      } catch {
        return null
      }
    })()
    const filtered = b.photo_urls
      .filter((u): u is string => typeof u === 'string')
      .filter((u) => {
        try {
          const parsed = new URL(u)
          return parsed.protocol === 'https:' && (!supabaseHost || parsed.hostname === supabaseHost)
        } catch {
          return false
        }
      })
      .slice(0, MAX_PHOTOS)
    photoUrls = filtered.length > 0 ? filtered : null
  }

  return {
    ok: true,
    value: {
      name,
      name_en: cleanText(b.name_en, 120),
      category,
      city,
      address,
      phone: cleanText(b.phone, 40),
      hours: cleanText(b.hours, 200),
      website,
      description: cleanText(b.description, MAX_DESCRIPTION_LENGTH),
      photo_urls: photoUrls,
      requester_email: requesterEmail,
      requester_name: cleanText(b.requester_name, 80),
    },
  }
}
