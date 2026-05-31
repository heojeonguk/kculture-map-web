// collect-places-new.mjs
// 실행: node collect-places-new.mjs
// 필요: GOOGLE_PLACES_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경변수
// Google Places API New (v1) 사용

import { createClient } from '@supabase/supabase-js'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

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

async function searchPlaces(query) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.photos,places.types,places.regularOpeningHours,places.location',
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: 'ko',
      maxResultCount: 20,
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.places || []
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

async function upsertPlaces(places) {
  if (places.length === 0) return
  const { error } = await supabase.from('places').upsert(places, { onConflict: 'name' })
  if (error) console.error('Upsert error:', error.message)
  else console.log(`  ✅ ${places.length}개 upsert 완료`)
}

async function main() {
  console.log('🚀 Google Places New API (v1) 데이터 수집 시작\n')

  const existingNames = await getExistingPlaceNames()
  console.log(`기존 장소 수: ${existingNames.size}개\n`)

  let totalProcessed = 0

  for (const target of SEARCH_TARGETS) {
    console.log(`🔍 검색: ${target.query}`)

    try {
      const results = await searchPlaces(target.query)
      const toUpsert = []

      for (const place of results) {
        const name = place.displayName?.text
        if (!name) continue

        // photo name 형식: "places/ChIJ.../photos/AfFOh..."
        const photoName = place.photos?.[0]?.name || null
        const isExisting = existingNames.has(name)

        if (isExisting) {
          // 기존 장소: photo_url만 업데이트
          if (photoName) {
            toUpsert.push({ name, photo_url: photoName })
            console.log(`  🔄 photo 업데이트: ${name}`)
          } else {
            console.log(`  ⏭️  스킵 (사진 없음): ${name}`)
          }
        } else {
          // 신규 장소: 전체 데이터 insert
          const category = mapCategory(place.types || [], target.category)
          toUpsert.push({
            name,
            name_en: null,
            name_zh: null,
            name_ja: null,
            city: target.city,
            category,
            rating: place.rating || null,
            address: place.formattedAddress || null,
            lat: place.location?.latitude || null,
            lng: place.location?.longitude || null,
            is_open: null,
            hours: null,
            price_range: null,
            emoji: EMOJI_MAP[category],
            featured: false,
            district: null,
            neighborhood: null,
            photo_url: photoName,
          })
          existingNames.add(name)
          console.log(`  ➕ ${name} (${category})`)
        }

        await new Promise(r => setTimeout(r, 200))
      }

      await upsertPlaces(toUpsert)
      totalProcessed += toUpsert.length

      await new Promise(r => setTimeout(r, 500))

    } catch (err) {
      console.error(`  ❌ 오류: ${err.message}`)
    }
  }

  console.log(`\n✅ 수집 완료! 총 ${totalProcessed}개 장소 처리됨`)
  console.log(`📊 현재 총 장소 수 (추정): ${existingNames.size}개`)
}

main()
