// match-tourapi-photos.mjs (v3 - clean rewrite)
// 실행: node match-tourapi-photos.mjs
//
// v3 변경사항:
//   - .env.local에서 읽은 키의 공백/탭/줄바꿈을 강제 제거 (sanitize)
//   - 디버그 로그를 JSON.stringify로 출력 (숨은 공백 확인 가능)
//   - URLSearchParams 미사용 (수동 URL 조립으로 이중 인코딩 방지)
//   - 단독 테스트("경복궁") 통과 후에만 본 작업 진행

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// ---------- .env.local 자동 로드 ----------
function loadEnvLocal() {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const content = fs.readFileSync(envPath, 'utf-8')
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) return
      const key = trimmed.slice(0, eqIdx).trim()
      let value = trimmed.slice(eqIdx + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    })
    console.log('.env.local 로드 완료')
  } catch (err) {
    console.log('.env.local 로드 실패:', err.message)
  }
}
loadEnvLocal()

// 키 sanitize: 공백, 탭, 줄바꿈, 캐리지리턴을 전부 제거
function sanitizeKey(raw) {
  return (raw || '').replace(/[\s\r\n\t]/g, '')
}

const TOUR_API_KEY_RAW = process.env.TOUR_API_KEY
const TOUR_API_KEY = sanitizeKey(TOUR_API_KEY_RAW)
const SUPABASE_URL = sanitizeKey(process.env.NEXT_PUBLIC_SUPABASE_URL)
const SUPABASE_SERVICE_KEY = sanitizeKey(process.env.SUPABASE_SERVICE_ROLE_KEY)

// ---------- 디버그 출력 ----------
console.log('')
console.log('=== 환경변수 점검 ===')
console.log('원본 TOUR_API_KEY length:', TOUR_API_KEY_RAW ? TOUR_API_KEY_RAW.length : 0)
console.log('정제 TOUR_API_KEY length:', TOUR_API_KEY.length)
console.log('정제 TOUR_API_KEY 앞 20자(JSON):', JSON.stringify(TOUR_API_KEY.slice(0, 20)))
console.log('정제 TOUR_API_KEY 뒤 20자(JSON):', JSON.stringify(TOUR_API_KEY.slice(-20)))
console.log('SUPABASE_URL:', SUPABASE_URL)
console.log('SUPABASE_SERVICE_KEY length:', SUPABASE_SERVICE_KEY.length)
console.log('====================')
console.log('')

if (!TOUR_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('환경변수 누락. .env.local 확인 필요')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const TOURAPI_BASE = 'https://apis.data.go.kr/B551011/KorService2'
const MAX_DISTANCE_KM = 2.0
const REQUEST_DELAY_MS = 150
const NAME_MIN_SIMILARITY = 0.3

let firstRequestLogged = false

// ---------- 유틸 ----------
function distanceKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Infinity
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function normalizeName(s) {
  if (!s) return ''
  return s.toLowerCase().replace(/[\s\-_·,.()[\]'"!@#$%^&*+=<>?/\\|`~]/g, '')
}

function nameSimilarity(a, b) {
  const na = normalizeName(a)
  const nb = normalizeName(b)
  if (!na || !nb) return 0
  if (na === nb) return 1.0
  if (na.includes(nb) || nb.includes(na)) return 0.9
  const setA = new Set(na)
  let common = 0
  for (const ch of nb) if (setA.has(ch)) common++
  return common / Math.min(na.length, nb.length)
}

// ---------- TourAPI ----------
async function searchTourAPI(keyword) {
  const encodedKeyword = encodeURIComponent(keyword)
  const url =
    TOURAPI_BASE +
    '/searchKeyword2' +
    '?serviceKey=' + TOUR_API_KEY +
    '&MobileOS=ETC' +
    '&MobileApp=KcultureMap' +
    '&_type=json' +
    '&numOfRows=10' +
    '&pageNo=1' +
    '&keyword=' + encodedKeyword

  if (!firstRequestLogged) {
    firstRequestLogged = true
    const masked = url.replace(
      TOUR_API_KEY,
      TOUR_API_KEY.slice(0, 10) + '...' + TOUR_API_KEY.slice(-5)
    )
    console.log('첫 요청 URL:', masked)
    console.log('')
  }

  const res = await fetch(url)
  if (!res.ok) {
    const errText = await res.text()
    throw new Error('HTTP ' + res.status + ': ' + errText.slice(0, 200))
  }

  const text = await res.text()
  if (text.trim().startsWith('<')) {
    throw new Error('XML 응답 (인증키 문제): ' + text.slice(0, 300))
  }

  const data = JSON.parse(text)
  const resultCode = data && data.response && data.response.header && data.response.header.resultCode
  if (resultCode && resultCode !== '0000') {
    const resultMsg = data.response.header.resultMsg
    throw new Error('API 오류 resultCode=' + resultCode + ' resultMsg=' + resultMsg)
  }

  const items = (data.response && data.response.body && data.response.body.items && data.response.body.items.item) || []
  return Array.isArray(items) ? items : [items]
}

function pickBestMatch(place, tourItems) {
  let best = null
  let bestScore = 0
  for (const item of tourItems) {
    if (!item.firstimage && !item.firstimage2) continue
    const nameScore = nameSimilarity(place.name, item.title)
    if (nameScore < NAME_MIN_SIMILARITY) continue
    const tLat = parseFloat(item.mapy)
    const tLng = parseFloat(item.mapx)
    const dist = distanceKm(place.lat, place.lng, tLat, tLng)
    if (place.lat && place.lng && dist > MAX_DISTANCE_KM) continue
    const distScore = isFinite(dist) ? Math.max(0, 1 - dist / MAX_DISTANCE_KM) : 0.5
    const score = nameScore * 0.7 + distScore * 0.3
    if (score > bestScore) {
      bestScore = score
      best = item
    }
  }
  return best
}

// ---------- Supabase ----------
async function fetchPlacesWithoutPhoto() {
  const places = []
  let from = 0
  const pageSize = 1000
  while (true) {
    const { data, error } = await supabase
      .from('places')
      .select('id, name, lat, lng')
      .is('photo_url', null)
      .range(from, from + pageSize - 1)
    if (error) {
      console.error('장소 조회 실패:', error.message)
      process.exit(1)
    }
    if (!data || data.length === 0) break
    places.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return places
}

async function updatePhotoUrl(id, photoUrl) {
  const { error } = await supabase.from('places').update({ photo_url: photoUrl }).eq('id', id)
  return error
}

// ---------- 메인 ----------
async function main() {
  console.log('TourAPI 사진 매칭 시작')
  console.log('')
  console.log('단독 테스트: "경복궁" 검색...')

  try {
    const testItems = await searchTourAPI('경복궁')
    console.log('테스트 성공! 결과 ' + testItems.length + '건, 첫 결과: ' + (testItems[0] && testItems[0].title))
    console.log('')
  } catch (err) {
    console.error('')
    console.error('테스트 실패: ' + err.message)
    console.error('본 작업을 중단합니다.')
    process.exit(1)
  }

  const places = await fetchPlacesWithoutPhoto()
  console.log('사진 없는 장소: ' + places.length + '개')
  console.log('')

  let matched = 0
  let noResult = 0
  let noImage = 0
  let errors = 0

  for (let i = 0; i < places.length; i++) {
    const place = places[i]
    const progress = '[' + (i + 1) + '/' + places.length + ']'
    try {
      const items = await searchTourAPI(place.name)
      if (items.length === 0) {
        noResult++
        if ((i + 1) % 50 === 0) {
          console.log(progress + ' 진행중... (매칭 ' + matched + ', 결과없음 ' + noResult + ', 이미지없음 ' + noImage + ')')
        }
      } else {
        const best = pickBestMatch(place, items)
        if (!best) {
          noImage++
        } else {
          const photoUrl = best.firstimage || best.firstimage2
          const err = await updatePhotoUrl(place.id, photoUrl)
          if (err) {
            console.error(progress + ' DB 업데이트 실패: ' + place.name + ' - ' + err.message)
            errors++
          } else {
            matched++
            console.log(progress + ' 매칭: ' + place.name + ' <- ' + best.title)
          }
        }
      }
    } catch (err) {
      errors++
      console.error(progress + ' 오류: ' + place.name + ': ' + err.message)
      if (errors >= 10 && matched === 0) {
        console.error('10건 연속 실패 + 매칭 0건. 중단합니다.')
        break
      }
    }
    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS))
  }

  console.log('')
  console.log('완료!')
  console.log('매칭 성공: ' + matched + '개')
  console.log('검색 결과 없음: ' + noResult + '개')
  console.log('이미지 있는 매칭 없음: ' + noImage + '개')
  console.log('오류: ' + errors + '개')
}

main()
