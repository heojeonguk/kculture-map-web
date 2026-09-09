// collect-places-new.mjs
// 실행: node collect-places-new.mjs
// 필요: GOOGLE_PLACES_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경변수
// Google Places API New (v1) 사용
//
// 수정 사항 (중요):
// - 기존 장소의 photo_url 업데이트와 신규 장소 upsert를 분리함
//   (이유: upsert 배열에 서로 다른 키 구조의 객체가 섞이면 PostgREST가
//    누락된 키를 NULL로 채워 ON CONFLICT DO UPDATE SET에 포함시킬 수 있어
//    기존 장소의 category/lat/lng 등이 NULL로 덮어써질 위험이 있음)

// .env.local 자동 로드 (외부 패키지 불필요)
import fs from 'fs'
import path from 'path'

function loadEnvLocal() {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const content = fs.readFileSync(envPath, 'utf-8')
    content.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) return
      const key = trimmed.slice(0, eqIdx).trim()
      let value = trimmed.slice(eqIdx + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    })
    console.log('✅ .env.local 로드 완료')
  } catch (err) {
    console.log('⚠️  .env.local 로드 실패 (환경변수 사용):', err.message)
  }
}
loadEnvLocal()

import { createClient } from '@supabase/supabase-js'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!GOOGLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 환경변수 누락: GOOGLE_PLACES_API_KEY / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 확인 필요')
  process.exit(1)
}

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

  // === 추가 검색 (사진 복구 확장) ===
  // 서울 세부 지역
  { city: '서울', query: '서울 맛집 성수동', category: 'food' },
  { city: '서울', query: '서울 맛집 신사동', category: 'food' },
  { city: '서울', query: '서울 맛집 압구정', category: 'food' },
  { city: '서울', query: '서울 맛집 잠실', category: 'food' },
  { city: '서울', query: '서울 맛집 여의도', category: 'food' },
  { city: '서울', query: '서울 맛집 종로 인사동', category: 'food' },
  { city: '서울', query: '서울 카페 익선동', category: 'cafe' },
  { city: '서울', query: '서울 카페 북촌', category: 'cafe' },
  { city: '서울', query: '서울 카페 서촌', category: 'cafe' },
  { city: '서울', query: '서울 관광지 경복궁 창덕궁', category: 'spot' },
  { city: '서울', query: '서울 관광지 남산', category: 'spot' },
  { city: '서울', query: '서울 관광지 한강', category: 'spot' },
  { city: '서울', query: '서울 쇼핑 가로수길', category: 'shopping' },
  { city: '서울', query: '서울 쇼핑 홍대', category: 'shopping' },

  // 부산 추가
  { city: '부산', query: '부산 카페 광안리', category: 'cafe' },
  { city: '부산', query: '부산 카페 송도', category: 'cafe' },
  { city: '부산', query: '부산 관광지 감천문화마을', category: 'spot' },
  { city: '부산', query: '부산 관광지 태종대 오륙도', category: 'spot' },
  { city: '부산', query: '부산 맛집 남포동 자갈치', category: 'food' },
  { city: '부산', query: '부산 맛집 기장', category: 'food' },

  // 제주 추가
  { city: '제주', query: '제주 카페 애월', category: 'cafe' },
  { city: '제주', query: '제주 카페 한림', category: 'cafe' },
  { city: '제주', query: '제주 카페 성산', category: 'cafe' },
  { city: '제주', query: '제주 맛집 애월', category: 'food' },
  { city: '제주', query: '제주 맛집 중문', category: 'food' },
  { city: '제주', query: '제주 관광지 성산일출봉', category: 'spot' },
  { city: '제주', query: '제주 관광지 한라산', category: 'spot' },

  // 경상 추가
  { city: '경상', query: '경주 카페', category: 'cafe' },
  { city: '경상', query: '경주 한옥마을', category: 'spot' },
  { city: '경상', query: '대구 관광지', category: 'spot' },
  { city: '경상', query: '안동 하회마을', category: 'spot' },

  // 전라 추가
  { city: '전라', query: '전주 카페 한옥마을', category: 'cafe' },
  { city: '전라', query: '여수 맛집', category: 'food' },
  { city: '전라', query: '여수 관광지', category: 'spot' },
  { city: '전라', query: '순천 관광지 정원', category: 'spot' },

  // 강원 추가
  { city: '강원', query: '강릉 관광지 경포대', category: 'spot' },
  { city: '강원', query: '속초 관광지 설악산', category: 'spot' },
  { city: '강원', query: '평창 관광지', category: 'spot' },

  // 경기 추가
  { city: '경기', query: '가평 카페', category: 'cafe' },
  { city: '경기', query: '파주 카페 헤이리', category: 'cafe' },
  { city: '경기', query: '에버랜드 용인', category: 'spot' },
  { city: '경기', query: '수원 화성', category: 'spot' },
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
  const names = new Set()
  let from = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('places')
      .select('name')
      .range(from, from + pageSize - 1)

    if (error) {
      console.error('❌ 기존 장소 조회 실패:', error.message)
      process.exit(1)
    }
    if (!data || data.length === 0) break

    data.forEach(p => names.add(p.name))
    if (data.length < pageSize) break
    from += pageSize
  }

  return names
}

// 신규 장소: 전체 컬럼 upsert (모든 객체가 동일한 키 구조를 가짐)
async function upsertNewPlaces(places) {
  if (places.length === 0) return
  const { error } = await supabase.from('places').upsert(places, { onConflict: 'name' })
  if (error) console.error('  ❌ 신규 장소 upsert 오류:', error.message)
  else console.log(`  ✅ 신규 장소 ${places.length}개 upsert 완료`)
}

// 기존 장소: photo_url만 개별 update (다른 컬럼에 영향 없음)
async function updatePhotoUrls(updates) {
  if (updates.length === 0) return
  const results = await Promise.all(
    updates.map(({ name, photo_url }) =>
      supabase.from('places').update({ photo_url }).eq('name', name)
    )
  )
  const failed = results.filter(r => r.error)
  if (failed.length > 0) {
    console.error(`  ❌ photo_url 업데이트 실패 ${failed.length}건:`, failed[0].error.message)
  }
  console.log(`  ✅ 기존 장소 photo_url ${updates.length - failed.length}개 업데이트 완료`)
}

async function main() {
  console.log('🚀 Google Places New API (v1) 데이터 수집 시작\n')

  const existingNames = await getExistingPlaceNames()
  console.log(`기존 장소 수: ${existingNames.size}개\n`)

  let totalNew = 0
  let totalPhotoUpdated = 0

  for (const target of SEARCH_TARGETS) {
    console.log(`🔍 검색: ${target.query}`)

    try {
      const results = await searchPlaces(target.query)
      const newPlaces = []
      const photoUpdates = []

      for (const place of results) {
        const name = place.displayName?.text
        if (!name) continue

        // photo name 형식: "places/ChIJ.../photos/AfFOh..."
        const photoName = place.photos?.[0]?.name || null
        const isExisting = existingNames.has(name)

        if (isExisting) {
          if (photoName) {
            photoUpdates.push({ name, photo_url: photoName })
            console.log(`  🔄 photo 업데이트 예정: ${name}`)
          } else {
            console.log(`  ⏭️  스킵 (사진 없음): ${name}`)
          }
        } else {
          const category = mapCategory(place.types || [], target.category)
          newPlaces.push({
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
      }

      await upsertNewPlaces(newPlaces)
      await updatePhotoUrls(photoUpdates)

      totalNew += newPlaces.length
      totalPhotoUpdated += photoUpdates.length

      await new Promise(r => setTimeout(r, 500))

    } catch (err) {
      console.error(`  ❌ 오류: ${err.message}`)
    }
  }

  console.log(`\n✅ 수집 완료!`)
  console.log(`   신규 장소: ${totalNew}개`)
  console.log(`   사진 업데이트: ${totalPhotoUpdated}개`)
  console.log(`📊 현재 총 장소 수 (추정): ${existingNames.size}개`)
}

main()
