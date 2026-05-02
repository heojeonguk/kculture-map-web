// collect-places-3.mjs
// 실행: node collect-places-3.mjs
// 목표: 5000개 달성

import { createClient } from '@supabase/supabase-js'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const TYPE_MAP = {
  restaurant: 'food', food: 'food', bakery: 'food', bar: 'food', meal_takeaway: 'food',
  cafe: 'cafe', coffee: 'cafe',
  tourist_attraction: 'spot', museum: 'spot', park: 'spot', amusement_park: 'spot',
  art_gallery: 'spot', church: 'spot', hindu_temple: 'spot', place_of_worship: 'spot',
  shopping_mall: 'shopping', store: 'shopping', market: 'shopping', clothing_store: 'shopping',
  department_store: 'shopping', book_store: 'shopping',
  spa: 'activity', gym: 'activity', night_club: 'activity', bowling_alley: 'activity',
  aquarium: 'activity', zoo: 'activity', stadium: 'activity',
}

const EMOJI_MAP = {
  food: '🍽️', cafe: '☕', spot: '📍', shopping: '🛍️', activity: '🎯',
}

const SEARCH_TARGETS = [
  // ===== 서울 외국인 핫플 =====
  // 홍대/마포
  { city: '서울', query: '홍대 클럽 나이트라이프', category: 'activity' },
  { city: '서울', query: '홍대 버스킹 공연장', category: 'spot' },
  { city: '서울', query: '연남동 맛집', category: 'food' },
  { city: '서울', query: '망원동 맛집 카페', category: 'cafe' },
  // 이태원/한남
  { city: '서울', query: '이태원 외국인 맛집', category: 'food' },
  { city: '서울', query: '이태원 루프탑바', category: 'activity' },
  { city: '서울', query: '한남동 갤러리 명소', category: 'spot' },
  { city: '서울', query: '경리단길 맛집', category: 'food' },
  { city: '서울', query: '해방촌 카페 맛집', category: 'cafe' },
  // 강남/서초
  { city: '서울', query: '강남 루프탑 레스토랑', category: 'food' },
  { city: '서울', query: '청담동 명품 쇼핑', category: 'shopping' },
  { city: '서울', query: '압구정 로데오 쇼핑', category: 'shopping' },
  { city: '서울', query: '코엑스 쇼핑몰 별마당도서관', category: 'spot' },
  { city: '서울', query: '강남 클럽 나이트라이프', category: 'activity' },
  // 종로/광화문
  { city: '서울', query: '경복궁 근처 한복체험', category: 'activity' },
  { city: '서울', query: '북촌한옥마을 관광', category: 'spot' },
  { city: '서울', query: '인사동 전통 공예', category: 'shopping' },
  { city: '서울', query: '광화문 광장 관광', category: 'spot' },
  { city: '서울', query: '창덕궁 비원 관광', category: 'spot' },
  { city: '서울', query: '종로 피맛골 맛집', category: 'food' },
  // 성수/건대
  { city: '서울', query: '성수동 팝업스토어', category: 'shopping' },
  { city: '서울', query: '성수동 수제화거리', category: 'shopping' },
  { city: '서울', query: '건대입구 맛집', category: 'food' },
  { city: '서울', query: '건대 카페거리', category: 'cafe' },
  // 명동/중구
  { city: '서울', query: '명동 길거리 음식', category: 'food' },
  { city: '서울', query: '명동 화장품 쇼핑', category: 'shopping' },
  { city: '서울', query: '남산타워 케이블카', category: 'spot' },
  { city: '서울', query: '동대문 DDP 야경', category: 'spot' },
  { city: '서울', query: '동대문 새벽 쇼핑', category: 'shopping' },
  // 용산/마포
  { city: '서울', query: '용산 전자상가', category: 'shopping' },
  { city: '서울', query: '서울 한강공원 피크닉', category: 'spot' },
  { city: '서울', query: '여의도 한강 불꽃축제', category: 'activity' },
  { city: '서울', query: '노을공원 하늘공원', category: 'spot' },
  // 기타 서울
  { city: '서울', query: '서울 루지 스카이라인', category: 'activity' },
  { city: '서울', query: '롯데월드 어드벤처', category: 'activity' },
  { city: '서울', query: '에버랜드 테마파크', category: 'activity' },
  { city: '서울', query: '서울 방탈출 카페', category: 'activity' },
  { city: '서울', query: '서울 노래방 문화', category: 'activity' },
  { city: '서울', query: '서울 찜질방 스파', category: 'activity' },
  { city: '서울', query: '익선동 한옥 카페', category: 'cafe' },
  { city: '서울', query: '을지로 힙지로 카페', category: 'cafe' },
  { city: '서울', query: '서촌 카페 맛집', category: 'cafe' },
  { city: '서울', query: '낙산공원 이화동 벽화마을', category: 'spot' },

  // ===== 부산 외국인 핫플 =====
  { city: '부산', query: '해운대 해수욕장 관광', category: 'spot' },
  { city: '부산', query: '광안리 야경 루프탑', category: 'spot' },
  { city: '부산', query: '감천문화마을 관광', category: 'spot' },
  { city: '부산', query: '부산 자갈치시장 해산물', category: 'food' },
  { city: '부산', query: '부산 국제시장 먹자골목', category: 'food' },
  { city: '부산', query: '부산 기장 해동용궁사', category: 'spot' },
  { city: '부산', query: '부산 흰여울문화마을', category: 'spot' },
  { city: '부산', query: '부산 송정해수욕장', category: 'spot' },
  { city: '부산', query: '부산 태종대 관광', category: 'spot' },
  { city: '부산', query: '부산 암남공원 두도', category: 'spot' },
  { city: '부산', query: '부산 전포 카페거리', category: 'cafe' },
  { city: '부산', query: '부산 서면 먹자골목', category: 'food' },
  { city: '부산', query: '부산 밀면 맛집', category: 'food' },
  { city: '부산', query: '부산 돼지국밥 맛집', category: 'food' },
  { city: '부산', query: '부산 씨앗호떡 길거리음식', category: 'food' },
  { city: '부산', query: '부산 스카이캡슐 트램', category: 'activity' },
  { city: '부산', query: '부산 롯데월드 어드벤처', category: 'activity' },
  { city: '부산', query: '영도 깡깡이예술마을', category: 'spot' },
  { city: '부산', query: '부산 온천장 허심청', category: 'activity' },

  // ===== 제주 외국인 핫플 =====
  { city: '제주', query: '한라산 등반 트레킹', category: 'activity' },
  { city: '제주', query: '성산일출봉 일출', category: 'spot' },
  { city: '제주', query: '우도 자전거 투어', category: 'activity' },
  { city: '제주', query: '제주 만장굴 용암동굴', category: 'spot' },
  { city: '제주', query: '제주 천지연폭포', category: 'spot' },
  { city: '제주', query: '제주 정방폭포', category: 'spot' },
  { city: '제주', query: '제주 올레길 트레킹', category: 'activity' },
  { city: '제주', query: '제주 협재해수욕장 에메랄드', category: 'spot' },
  { city: '제주', query: '제주 함덕해수욕장', category: 'spot' },
  { city: '제주', query: '제주 중문 관광단지', category: 'spot' },
  { city: '제주', query: '제주 테디베어뮤지엄', category: 'spot' },
  { city: '제주', query: '제주 아쿠아플라넷', category: 'activity' },
  { city: '제주', query: '제주 카멜리아힐', category: 'spot' },
  { city: '제주', query: '제주 사려니숲길', category: 'activity' },
  { city: '제주', query: '애월 카페거리 해변', category: 'cafe' },
  { city: '제주', query: '제주 흑돼지 맛집', category: 'food' },
  { city: '제주', query: '제주 해산물 맛집', category: 'food' },
  { city: '제주', query: '제주 감귤 체험농장', category: 'activity' },
  { city: '제주', query: '제주 승마 체험', category: 'activity' },
  { city: '제주', query: '제주 스쿠버다이빙', category: 'activity' },

  // ===== 경주 (외국인 필수 코스) =====
  { city: '경상', query: '경주 불국사 관광', category: 'spot' },
  { city: '경상', query: '경주 석굴암 관광', category: 'spot' },
  { city: '경상', query: '경주 첨성대 관광', category: 'spot' },
  { city: '경상', query: '경주 안압지 동궁월지', category: 'spot' },
  { city: '경상', query: '경주 대릉원 왕릉', category: 'spot' },
  { city: '경상', query: '경주 황리단길 카페', category: 'cafe' },
  { city: '경상', query: '경주 황리단길 맛집', category: 'food' },
  { city: '경상', query: '경주 국립박물관', category: 'spot' },
  { city: '경상', query: '경주 보문호수 관광', category: 'spot' },
  { city: '경상', query: '경주 교촌한옥마을', category: 'spot' },

  // ===== 전주 (외국인 필수) =====
  { city: '전라', query: '전주 한옥마을 관광', category: 'spot' },
  { city: '전라', query: '전주 한복 체험', category: 'activity' },
  { city: '전라', query: '전주 비빔밥 맛집', category: 'food' },
  { city: '전라', query: '전주 막걸리 골목', category: 'food' },
  { city: '전라', query: '전주 초코파이 수제', category: 'food' },
  { city: '전라', query: '전주 오목대 관광', category: 'spot' },
  { city: '전라', query: '전주 전동성당', category: 'spot' },

  // ===== 인천 =====
  { city: '인천', query: '인천 차이나타운 짜장면', category: 'food' },
  { city: '인천', query: '인천 송월동 동화마을', category: 'spot' },
  { city: '인천', query: '인천 개항장 근대건축', category: 'spot' },
  { city: '인천', query: '인천 월미도 놀이공원', category: 'activity' },
  { city: '인천', query: '강화도 고인돌 역사', category: 'spot' },
  { city: '인천', query: '인천 송도 센트럴파크', category: 'spot' },
  { city: '인천', query: '인천 을왕리 해수욕장', category: 'spot' },
  { city: '인천', query: '인천 개항로 카페', category: 'cafe' },
  { city: '인천', query: '인천 소래포구 해산물', category: 'food' },
  { city: '인천', query: '인천 청라 카페', category: 'cafe' },

  // ===== 강원 외국인 핫플 =====
  { city: '강원', query: '강릉 커피거리 카페', category: 'cafe' },
  { city: '강원', query: '강릉 오죽헌 관광', category: 'spot' },
  { city: '강원', query: '강릉 경포대 해수욕장', category: 'spot' },
  { city: '강원', query: '속초 아바이마을 관광', category: 'spot' },
  { city: '강원', query: '속초 설악산 국립공원', category: 'spot' },
  { city: '강원', query: '속초 해수욕장 관광', category: 'spot' },
  { city: '강원', query: '양양 서핑 포인트', category: 'activity' },
  { city: '강원', query: '양양 서피비치', category: 'activity' },
  { city: '강원', query: '강원 스키장 리조트', category: 'activity' },
  { city: '강원', query: '평창 대관령 목장', category: 'spot' },
  { city: '강원', query: '춘천 소양강 스카이워크', category: 'spot' },
  { city: '강원', query: '동해 무릉계곡', category: 'spot' },

  // ===== 경기 외국인 핫플 =====
  { city: '경기', query: '수원화성 성곽 관광', category: 'spot' },
  { city: '경기', query: 'DMZ 비무장지대 투어', category: 'activity' },
  { city: '경기', query: '파주 임진각 관광', category: 'spot' },
  { city: '경기', query: '파주 헤이리 예술마을', category: 'spot' },
  { city: '경기', query: '파주 프리미엄아울렛', category: 'shopping' },
  { city: '경기', query: '가평 남이섬 관광', category: 'spot' },
  { city: '경기', query: '가평 쁘띠프랑스', category: 'spot' },
  { city: '경기', query: '가평 아침고요수목원', category: 'spot' },
  { city: '경기', query: '용인 한국민속촌', category: 'spot' },
  { city: '경기', query: '용인 에버랜드', category: 'activity' },
  { city: '경기', query: '양평 두물머리 관광', category: 'spot' },
  { city: '경기', query: '광주 화담숲', category: 'spot' },

  // ===== 충청 =====
  { city: '충청', query: '공주 공산성 백제역사', category: 'spot' },
  { city: '충청', query: '부여 백제문화단지', category: 'spot' },
  { city: '충청', query: '보령 머드축제 해수욕장', category: 'activity' },
  { city: '충청', query: '단양 도담삼봉 관광', category: 'spot' },
  { city: '충청', query: '충주호 유람선', category: 'activity' },
  { city: '충청', query: '대전 엑스포과학공원', category: 'spot' },
  { city: '충청', query: '대전 성심당 빵집', category: 'food' },
  { city: '충청', query: '천안 독립기념관', category: 'spot' },
  { city: '충청', query: '아산 현충사 관광', category: 'spot' },

  // ===== 전라 추가 =====
  { city: '전라', query: '여수 밤바다 야경', category: 'spot' },
  { city: '전라', query: '여수 돌산 케이블카', category: 'activity' },
  { city: '전라', query: '여수 향일암 관광', category: 'spot' },
  { city: '전라', query: '순천만 국가정원', category: 'spot' },
  { city: '전라', query: '담양 죽녹원 대나무숲', category: 'spot' },
  { city: '전라', query: '담양 메타세쿼이아길', category: 'spot' },
  { city: '전라', query: '광주 518민주화운동', category: 'spot' },
  { city: '전라', query: '목포 근대역사거리', category: 'spot' },
  { city: '전라', query: '보성 녹차밭 관광', category: 'spot' },

  // ===== K-POP/한류 특화 =====
  { city: '서울', query: '서울 SM타운 코엑스', category: 'spot' },
  { city: '서울', query: '서울 하이브 빅히트 투어', category: 'spot' },
  { city: '서울', query: '서울 K-POP 콘서트장', category: 'activity' },
  { city: '서울', query: '서울 아이돌 팬미팅 장소', category: 'activity' },
  { city: '서울', query: '서울 한류스타 굿즈샵', category: 'shopping' },
  { city: '서울', query: '서울 케이팝 댄스학원 체험', category: 'activity' },
  { city: '서울', query: '신촌 이대 아이돌 굿즈', category: 'shopping' },

  // ===== 한국 전통문화 체험 =====
  { city: '서울', query: '서울 전통 도자기 체험', category: 'activity' },
  { city: '서울', query: '서울 한지 공예 체험', category: 'activity' },
  { city: '서울', query: '서울 전통 다도 체험', category: 'activity' },
  { city: '서울', query: '서울 사물놀이 국악 공연', category: 'activity' },
  { city: '서울', query: '서울 비빔밥 김치 요리 체험', category: 'activity' },

  // ===== 야경/뷰포인트 =====
  { city: '서울', query: '서울 야경 뷰포인트', category: 'spot' },
  { city: '서울', query: '서울 스카이덱 전망대', category: 'spot' },
  { city: '부산', query: '부산 야경 뷰포인트', category: 'spot' },
  { city: '제주', query: '제주 일출 명소', category: 'spot' },

  // ===== 한국 음식 특화 =====
  { city: '서울', query: '서울 삼겹살 맛집 외국인', category: 'food' },
  { city: '서울', query: '서울 치킨 맥주 호프집', category: 'food' },
  { city: '서울', query: '서울 떡볶이 분식', category: 'food' },
  { city: '서울', query: '서울 순대 포장마차', category: 'food' },
  { city: '서울', query: '서울 한정식 레스토랑', category: 'food' },
  { city: '부산', query: '부산 회센터 생선회', category: 'food' },
  { city: '제주', query: '제주 갈치조림 맛집', category: 'food' },
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
  console.log('🚀 외국인 핫플 중심 대량 수집 시작\n')

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

        const photoRef = detail.photos?.[0]?.photo_reference || null
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
