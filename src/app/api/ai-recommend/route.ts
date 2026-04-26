import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const systemPrompts: Record<string, string> = {
  ko: '당신은 한국 여행 전문 가이드입니다. 반드시 한국어로만 답변해주세요.',
  en: 'You are a Korea travel expert guide. Please respond in English only.',
  ja: 'あなたは韓国旅行の専門ガイドです。必ず日本語のみで回答してください。',
  'zh-CN': '您是韩国旅游专业导游。请只用简体中文回答。',
  'zh-TW': '您是韓國旅遊專業導遊。請只用繁體中文回答。',
  th: 'คุณเป็นไกด์นำเที่ยวเกาหลีมืออาชีพ กรุณาตอบเป็นภาษาไทยเท่านั้น',
  vi: 'Bạn là hướng dẫn viên du lịch Hàn Quốc chuyên nghiệp. Vui lòng chỉ trả lời bằng tiếng Việt.',
  id: 'Anda adalah pemandu wisata Korea profesional. Mohon hanya menjawab dalam Bahasa Indonesia.',
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, locale } = await request.json()

    const systemPrompt = systemPrompts[locale] ?? systemPrompts.en

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })

    const result = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ result })
  } catch (error) {
    console.error('AI recommend error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
