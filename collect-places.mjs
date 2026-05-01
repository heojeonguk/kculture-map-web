// collect-places.mjs
// 실행: node collect-places.mjs
// 필요: GOOGLE_PLACES_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY 환경변수

import { createClient } from '@supabase/supabase-js'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY // service role key 필요 (RLS 우회)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// 카테고리 매핑 (Google type → our category)
const TYPE_MAP = {
  restaurant: 'food',
  food: 'food',
  bakery: 'food',
  bar: 'food',
  cafe: 'cafe',
  coffee: 'cafe',
  tourist_attraction: 'spot',
  museum: 'spot',
  park: 'spot',
  amusement_park: 'spot',
  shopping_mall: 'shopping',
  store: 'shopping',
  market: 'shopping',
  clothing_store: 'shopping',
  spa: 'activity',
  gym: 'activity',
  night_club: 'activity',
}

const EMOJI_MAP = {
  food: '🍽️',
  cafe: '☕',
  spot: '📍',
  shopping: '🛍️',
  activity: '🎯',
}

// 수집할 도시 + 검색 키워드 목록
const SEARCH_TARGETS = [
  // 서울
  { city: '서울', query: '서울 맛집 홍대', category: 'food' },
  { city: '서울', query: '서울 맛집 강남', category: 'food' },
  { city: '서울', query: '서울 맛집 이태원', category: 'food' },
  { city: '서울', query: '서울 맛집 명동', category: 'food' },
  { city: '서울', query: '서울 맛집 종로', category: 'food' },
  { city: '서울', query: '서울 카페 성수', category: 'cafe' },
  { city: '서울', query: '서울 카페 홍대', category: 'cafe' },
  { city: '서울', query: '서울 카페 강남', category: 'cafe' },
  { city: '서울', query: '서울 카페 연남동', category: 'cafe' },
  { city: '서울', query: '서울 관광지 명소', category: 'spot' },
  { city: '서울', query: '서울 쇼핑 명동', category: 'shopping' },
  { city: '서울', query: '서울 쇼핑 동대문', category: 'shopping' },
  { city: '서울', query: '서울 액티비티 체험', category: 'activity' },

  // 부산
  { city: '부산', query: '부산 맛집 해운대', category: 'food' },
  { city: '부산', query: '부산 맛집 서면', category: 'food' },
  { city: '부산', query: '부산 맛집 광안리', category: 'food' },
  { city: '부산', query: '부산 카페 해운대', category: 'cafe' },
  { city: '부산', query: '부산 카페 감천문화마을', category: 'cafe' },
  { city: '부산', query: '부산 관광지 명소', category: 'spot' },
  { city: '부산', query: '부산 쇼핑', category: 'shopping' },

  // 제주
  { city: '제주', query: '제주 맛집 제주시', category: 'food' },
  { city: '제주', query: '제주 맛집 서귀포', category: 'food' },
  { city: '제주', query: '제주 카페', category: 'cafe' },
  { city: '제주', query: '제주 관광지 명소', category: 'spot' },
  { city: '제주', query: '제주 액티비티', category: 'activity' },

  // 경기
  { city: '경기', query: '수원 맛집', category: 'food' },
  { city: '경기', query: '수원 관광지', category: 'spot' },
  { city: '경기', query: '경기 카페 유명한곳', category: 'cafe' },
  { city: '경기', query: '가평 관광지', category: 'spot' },
  { city: '경기', query: '용인 관광지', category: 'spot' },

  // 인천
  { city: '인천', query: '인천 맛집 차이나타운', category: 'food' },
  { city: '인천', query: '인천 관광지 명소', category: 'spot' },
  { city: '인천', query: '인천 카페', category: 'cafe' },

  // 강원
  { city: '강원', query: '강릉 맛집', category: 'food' },
  { city: '강원', query: '강릉 카페', category: 'cafe' },
  { city: '강원', query: '속초 맛집', category: 'food' },
  { city: '강원', query: '강원 관광지 명소', category: 'spot' },
  { city: '강원', query: '강원 액티비티', category: 'activity' },

  // 경상
  { city: '경상', query: '경주 관광지', category: 'spot' },
  { city: '경상', query: '경주 맛집', category: 'food' },
  { city: '경상', query: '대구 맛집', category: 'food' },
  { city: '경상', query: '대구 카페', category: 'cafe' },

  // 전라
  { city: '전라', query: '전주 맛집 한옥마을', category: 'food' },
  { city: '전라', query: '전주 관광지', category: 'spot' },
  { city: '전라', query: '광주 맛집', category: 'food' },
  { city: '전라', query: '전라 카페', category: 'cafe' },

  // 충청
  { city: '충청', query: '대전 맛집', category: 'food' },
  { city: '충청', query: '충청 관광지', category: 'spot' },
  { city: '충청', query: '공주 부여 관광지', category: 'spot' },
]

// Google Places Text Search API 호출
async function searchPlaces(query) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=ko&region=kr&key=${GOOGLE_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  return data.results || []
}

// Place Detail 가져오기 (사진, 전화번호 등)
async function getPlaceDetail(placeId) {
  const fields = 'name,rating,formatted_address,geometry,photos,types,opening_hours,price_level,editorial_summary'
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&language=ko&key=${GOOGLE_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  return data.result || null
}

// 사진 URL 생성
function getPhotoUrl(photoReference) {
  if (!photoReference) return null
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`
}

// Google types → our category 변환
function mapCategory(types, defaultCategory) {
  for (const type of types) {
    if (TYPE_MAP[type]) return TYPE_MAP[type]
  }
  return defaultCategory
}

// 이미 DB에 있는 장소 이름 목록 가져오기
async function getExistingPlaceNames() {
  const { data } = await supabase.from('places').select('name')
  return new Set(data?.map(p => p.name) || [])
}

// Supabase에 저장
async function savePlaces(places) {
  if (places.length === 0) return
  const { error } = await supabase.from('places').insert(places)
  if (error) console.error('Insert error:', error.message)
  else console.log(`  ✅ ${places.length}개 저장 완료`)
}

// 메인 실행
async function main() {
  console.log('🚀 Google Places 데이터 수집 시작\n')

  const existingNames = await getExistingPlaceNames()
  console.log(`기존 장소 수: ${existingNames.size}개\n`)

  let totalSaved = 0

  for (const target of SEARCH_TARGETS) {
    console.log(`🔍 검색: ${target.query}`)

    try {
      const results = await searchPlaces(target.query)
      const toInsert = []

      for (const place of results) {
        // 중복 체크
        if (existingNames.has(place.name)) {
          console.log(`  ⏭️  중복 스킵: ${place.name}`)
          continue
        }

        // 상세 정보 가져오기
        const detail = await getPlaceDetail(place.place_id)
        if (!detail) continue

        const photoRef = detail.photos?.[0]?.photo_reference
        const category = mapCategory(detail.types || [], target.category)

        const newPlace = {
          name: detail.name,
          name_en: null, // 추후 번역
          name_zh: null,
          name_ja: null,
          city: target.city,
          category,
          rating: detail.rating || null,
          address: detail.formatted_address || null,
          lat: detail.geometry?.location?.lat || null,
          lng: detail.geometry?.location?.lng || null,
          is_open: null,
          hours: null,
          price_range: detail.price_level ? '💰'.repeat(detail.price_level) : null,
          emoji: EMOJI_MAP[category],
          featured: false,
          district: null,
          neighborhood: null,
          photo_url: photoRef ? getPhotoUrl(photoRef) : null,
        }

        toInsert.push(newPlace)
        existingNames.add(detail.name) // 이번 배치 내 중복 방지
        console.log(`  ➕ ${detail.name} (${category})`)

        // API 요청 제한 방지
        await new Promise(r => setTimeout(r, 200))
      }

      await savePlaces(toInsert)
      totalSaved += toInsert.length

      // 검색 간 딜레이
      await new Promise(r => setTimeout(r, 500))

    } catch (err) {
      console.error(`  ❌ 오류: ${err.message}`)
    }
  }

  console.log(`\n✅ 수집 완료! 총 ${totalSaved}개 장소 추가됨`)
  console.log(`📊 현재 총 장소 수: ${existingNames.size}개`)
}

main()
