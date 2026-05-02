// collect-places-2.mjs
// 실행: node collect-places-2.mjs
// 필요: GOOGLE_PLACES_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const TYPE_MAP = {
  restaurant: 'food', food: 'food', bakery: 'food', bar: 'food',
  cafe: 'cafe', coffee: 'cafe',
  tourist_attraction: 'spot', museum: 'spot', park: 'spot', amusement_park: 'spot',
  shopping_mall: 'shopping', store: 'shopping', market: 'shopping', clothing_store: 'shopping',
  spa: 'activity', gym: 'activity', night_club: 'activity',
}

const EMOJI_MAP = {
  food: '🍽️', cafe: '☕', spot: '📍', shopping: '🛍️', activity: '🎯',
}

const SEARCH_TARGETS = [
  // 인천 집중
  { city: '인천', query: '인천 맛집 송도', category: 'food' },
  { city: '인천', query: '인천 맛집 부평', category: 'food' },
  { city: '인천', query: '인천 맛집 강화도', category: 'food' },
  { city: '인천', query: '인천 카페 송도', category: 'cafe' },
  { city: '인천', query: '인천 카페 개항로', category: 'cafe' },
  { city: '인천', query: '인천 관광지 강화도', category: 'spot' },
  { city: '인천', query: '인천 관광지 월미도', category: 'spot' },
  { city: '인천', query: '인천 쇼핑 롯데마트', category: 'shopping' },
  { city: '인천', query: '인천 액티비티 체험', category: 'activity' },
  { city: '인천', query: '인천 맛집 연수구', category: 'food' },
  { city: '인천', query: '인천 카페 을왕리', category: 'cafe' },
  { city: '인천', query: '인천 관광지 소래포구', category: 'spot' },

  // 충청 집중
  { city: '충청', query: '대전 맛집 은행동', category: 'food' },
  { city: '충청', query: '대전 맛집 둔산동', category: 'food' },
  { city: '충청', query: '대전 카페', category: 'cafe' },
  { city: '충청', query: '천안 맛집', category: 'food' },
  { city: '충청', query: '천안 카페', category: 'cafe' },
  { city: '충청', query: '충주 관광지', category: 'spot' },
  { city: '충청', query: '청주 맛집', category: 'food' },
  { city: '충청', query: '청주 카페', category: 'cafe' },
  { city: '충청', query: '아산 온양온천', category: 'activity' },
  { city: '충청', query: '보령 대천해수욕장', category: 'spot' },
  { city: '충청', query: '단양 관광지', category: 'spot' },
  { city: '충청', query: '제천 관광지', category: 'spot' },

  // 서울 세부 동네
  { city: '서울', query: '서울 성수동 카페', category: 'cafe' },
  { city: '서울', query: '서울 성수동 맛집', category: 'food' },
  { city: '서울', query: '서울 합정동 카페', category: 'cafe' },
  { city: '서울', query: '서울 연남동 카페', category: 'cafe' },
  { city: '서울', query: '서울 압구정 맛집', category: 'food' },
  { city: '서울', query: '서울 압구정 카페', category: 'cafe' },
  { city: '서울', query: '서울 한남동 맛집', category: 'food' },
  { city: '서울', query: '서울 한남동 카페', category: 'cafe' },
  { city: '서울', query: '서울 을지로 맛집', category: 'food' },
  { city: '서울', query: '서울 북촌 관광지', category: 'spot' },
  { city: '서울', query: '서울 인사동 관광지', category: 'spot' },
  { city: '서울', query: '서울 DDP 관광지', category: 'spot' },
  { city: '서울', query: '서울 잠실 액티비티', category: 'activity' },
  { city: '서울', query: '서울 강남 쇼핑', category: 'shopping' },
  { city: '서울', query: '서울 신촌 맛집', category: 'food' },

  // 경기 세부
  { city: '경기', query: '판교 맛집', category: 'food' },
  { city: '경기', query: '분당 카페', category: 'cafe' },
  { city: '경기', query: '일산 맛집', category: 'food' },
  { city: '경기', query: '파주 카페', category: 'cafe' },
  { city: '경기', query: '파주 관광지 헤이리', category: 'spot' },
  { city: '경기', query: '양평 카페', category: 'cafe' },
  { city: '경기', query: '양평 관광지', category: 'spot' },
  { city: '경기', query: '남양주 카페', category: 'cafe' },
  { city: '경기', query: '포천 관광지', category: 'spot' },
  { city: '경기', query: '성남 맛집', category: 'food' },

  // 강원 추가
  { city: '강원', query: '강릉 맛집 안목해변', category: 'food' },
  { city: '강원', query: '양양 서핑 액티비티', category: 'activity' },
  { city: '강원', query: '평창 관광지', category: 'spot' },
  { city: '강원', query: '춘천 맛집', category: 'food' },
  { city: '강원', query: '춘천 카페', category: 'cafe' },
  { city: '강원', query: '강원 스키장 액티비티', category: 'activity' },

  // 경상 추가
  { city: '경상', query: '대구 동성로 맛집', category: 'food' },
  { city: '경상', query: '대구 수성못 카페', category: 'cafe' },
  { city: '경상', query: '경주 맛집 황리단길', category: 'food' },
  { city: '경상', query: '경주 카페', category: 'cafe' },
  { city: '경상', query: '통영 맛집', category: 'food' },
  { city: '경상', query: '거제 관광지', category: 'spot' },

  // 전라 추가
  { city: '전라', query: '전주 한옥마을 카페', category: 'cafe' },
  { city: '전라', query: '광주 동명동 카페', category: 'cafe' },
  { city: '전라', query: '광주 맛집', category: 'food' },
  { city: '전라', query: '여수 맛집', category: 'food' },
  { city: '전라', query: '여수 관광지 돌산도', category: 'spot' },
  { city: '전라', query: '순천 관광지', category: 'spot' },

  // 부산 추가
  { city: '부산', query: '부산 전포동 카페', category: 'cafe' },
  { city: '부산', query: '부산 남포동 맛집', category: 'food' },
  { city: '부산', query: '부산 기장 맛집', category: 'food' },
  { city: '부산', query: '부산 영도 카페', category: 'cafe' },
  { city: '부산', query: '부산 해운대 액티비티', category: 'activity' },

  // 제주 추가
  { city: '제주', query: '제주 애월 카페', category: 'cafe' },
  { city: '제주', query: '제주 성산 관광지', category: 'spot' },
  { city: '제주', query: '제주 협재 관광지', category: 'spot' },
  { city: '제주', query: '제주 서귀포 맛집', category: 'food' },
  { city: '제주', query: '제주 액티비티 해수욕', category: 'activity' },
]

async function searchPlaces(query) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=ko&region=kr&key=${GOOGLE_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  return data.results || []
}

async function getPlaceDetail(placeId) {
  const fields = 'name,rating,formatted_address,geometry,photos,types,price_level'
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&language=ko&key=${GOOGLE_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  return data.result || null
}

function getPhotoReference(detail) {
  return detail.photos?.[0]?.photo_reference || null
}

function mapCategory(types, defaultCategory) {
  for (const type of types) {
    if (TYPE_MAP[type]) return TYPE_MAP[type]
  }
  return defaultCategory
}

async function getExistingPlaceNames() {
  const { data } = await supabase.from('places').select('name')
  return new Set(data?.map(p => p.name) || [])
}

async function savePlaces(places) {
  if (places.length === 0) return
  const { error } = await supabase.from('places').insert(places)
  if (error) console.error('Insert error:', error.message)
  else console.log(`  ✅ ${places.length}개 저장 완료`)
}

async function main() {
  console.log('🚀 추가 장소 데이터 수집 시작\n')

  const existingNames = await getExistingPlaceNames()
  console.log(`기존 장소 수: ${existingNames.size}개\n`)

  let totalSaved = 0

  for (const target of SEARCH_TARGETS) {
    console.log(`🔍 검색: ${target.query}`)

    try {
      const results = await searchPlaces(target.query)
      const toInsert = []

      for (const place of results) {
        if (existingNames.has(place.name)) {
          console.log(`  ⏭️  중복 스킵: ${place.name}`)
          continue
        }

        const detail = await getPlaceDetail(place.place_id)
        if (!detail) continue

        const photoRef = getPhotoReference(detail)
        const category = mapCategory(detail.types || [], target.category)

        const newPlace = {
          name: detail.name,
          name_en: null,
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
          photo_url: photoRef || null,
        }

        toInsert.push(newPlace)
        existingNames.add(detail.name)
        console.log(`  ➕ ${detail.name} (${category}) ${photoRef ? '📸' : ''}`)

        await new Promise(r => setTimeout(r, 200))
      }

      await savePlaces(toInsert)
      totalSaved += toInsert.length
      await new Promise(r => setTimeout(r, 500))

    } catch (err) {
      console.error(`  ❌ 오류: ${err.message}`)
    }
  }

  console.log(`\n✅ 수집 완료! 총 ${totalSaved}개 장소 추가됨`)
  console.log(`📊 현재 총 장소 수: ${existingNames.size}개`)
}

main()
