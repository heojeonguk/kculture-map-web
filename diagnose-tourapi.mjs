// diagnose-tourapi.mjs
// Run: node diagnose-tourapi.mjs
// Tests 4 key variants to find which one the API accepts.

import fs from 'fs'
import path from 'path'

function loadEnvLocal() {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const content = fs.readFileSync(envPath, 'utf-8')
    content.split(/\r?\n/).forEach(function (line) {
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
    console.log('env loaded ok')
  } catch (err) {
    console.log('env load failed:', err.message)
  }
}
loadEnvLocal()

const RAW = process.env.TOUR_API_KEY || ''

console.log('')
console.log('=== RAW KEY ANALYSIS ===')
console.log('length:', RAW.length)
console.log('JSON (first 30):', JSON.stringify(RAW.slice(0, 30)))
console.log('JSON (last 30):', JSON.stringify(RAW.slice(-30)))
console.log('char codes of first 5:', RAW.slice(0, 5).split('').map(function (c) { return c.charCodeAt(0) }))
console.log('contains %:', RAW.indexOf('%') !== -1)
console.log('contains +:', RAW.indexOf('+') !== -1)
console.log('contains /:', RAW.indexOf('/') !== -1)
console.log('contains =:', RAW.indexOf('=') !== -1)
console.log('contains space:', RAW.indexOf(' ') !== -1)
console.log('========================')
console.log('')

const variants = []

// variant 1: raw as-is
variants.push({ name: 'raw (as-is)', key: RAW })

// variant 2: whitespace stripped
const stripped = RAW.replace(/[\s\r\n\t]/g, '')
variants.push({ name: 'whitespace stripped', key: stripped })

// variant 3: decoded (if it was URL-encoded)
let decoded = stripped
try {
  decoded = decodeURIComponent(stripped)
} catch (e) {
  decoded = stripped
}
if (decoded !== stripped) {
  variants.push({ name: 'decoded', key: decoded })
}

// variant 4: encoded (if it was raw)
const encoded = encodeURIComponent(stripped)
if (encoded !== stripped) {
  variants.push({ name: 'encoded', key: encoded })
}

const BASE = 'https://apis.data.go.kr/B551011/KorService2/searchKeyword2'

async function testKey(variant) {
  const url =
    BASE +
    '?serviceKey=' + variant.key +
    '&MobileOS=ETC' +
    '&MobileApp=Test' +
    '&_type=json' +
    '&numOfRows=1' +
    '&pageNo=1' +
    '&keyword=' + encodeURIComponent('경복궁')

  console.log('--- Testing: ' + variant.name + ' (len ' + variant.key.length + ') ---')

  try {
    const res = await fetch(url)
    console.log('  HTTP status:', res.status)

    const text = await res.text()

    if (res.status === 200) {
      if (text.trim().charAt(0) === '{') {
        try {
          const data = JSON.parse(text)
          const code = data.response && data.response.header && data.response.header.resultCode
          const msg = data.response && data.response.header && data.response.header.resultMsg
          console.log('  resultCode:', code, 'resultMsg:', msg)
          if (code === '0000') {
            console.log('  *** SUCCESS *** this variant works!')
            return true
          }
        } catch (e) {
          console.log('  JSON parse failed:', text.slice(0, 150))
        }
      } else {
        console.log('  non-JSON response:', text.slice(0, 200))
      }
    } else {
      console.log('  body:', text.slice(0, 200))
    }
  } catch (err) {
    console.log('  fetch error:', err.message)
  }
  console.log('')
  return false
}

async function main() {
  let anySuccess = false
  for (let i = 0; i < variants.length; i++) {
    const ok = await testKey(variants[i])
    if (ok) {
      anySuccess = true
      console.log('')
      console.log('>>> USE THIS VARIANT: ' + variants[i].name)
      console.log('')
      break
    }
    await new Promise(function (r) { setTimeout(r, 300) })
  }

  if (!anySuccess) {
    console.log('')
    console.log('All variants failed. Next steps:')
    console.log('  1. Check the key is copied fully from data.go.kr')
    console.log('  2. Wait longer for activation (can take a few hours)')
    console.log('  3. Verify the service is KorService2 (with _GW suffix)')
  }
}

main()
