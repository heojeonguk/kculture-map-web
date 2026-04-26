import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const languageNames: Record<string, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  th: 'ภาษาไทย',
  vi: 'Tiếng Việt',
  id: 'Bahasa Indonesia',
}

export async function POST(request: NextRequest) {
  try {
    const { text, targetLocale } = await request.json()
    const targetLang = languageNames[targetLocale] ?? 'English'

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `다음 텍스트를 ${targetLang}로 번역해주세요. 번역문만 출력하고 다른 설명은 하지 마세요:\n\n${text}`
      }],
    })

    const translated = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ translated })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
