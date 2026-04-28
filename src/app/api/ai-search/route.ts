import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  try {
    const { query, locale } = await request.json()
    if (!query?.trim()) {
      return NextResponse.json({ answer: '', places: [], posts: [] })
    }

    const supabase = await createClient()

    const [{ data: placesData }, { data: postsData }] = await Promise.all([
      supabase
        .from('places')
        .select('id, name, name_en, category, city, district, address, emoji, rating'),
      supabase
        .from('posts')
        .select('id, title, content, category, city, user_name, likes')
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: `You are a Korean culture travel assistant for K컬처MAP.
Based on the user's search query, find the most relevant places and community posts from the provided data.
Return ONLY a JSON object with this exact structure, no other text:
{
  "answer": "brief helpful answer in the user's language (2-3 sentences)",
  "places": [array of up to 4 most relevant place ids as strings],
  "posts": [array of up to 3 most relevant post ids as strings]
}
User language: if locale is 'ko' respond in Korean, otherwise respond in English.`,
      messages: [
        {
          role: 'user',
          content: `Search query: ${query}

Available places: ${JSON.stringify(placesData ?? [])}

Available posts: ${JSON.stringify(postsData ?? [])}`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    let parsed: { answer: string; places: string[]; posts: string[] }
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch?.[0] ?? raw)
    } catch {
      return NextResponse.json({ answer: raw, places: [], posts: [] })
    }

    const placeIds = parsed.places ?? []
    const postIds = parsed.posts ?? []

    const [{ data: fullPlaces }, { data: fullPosts }] = await Promise.all([
      placeIds.length > 0
        ? supabase
            .from('places')
            .select('id, name, name_en, category, city, emoji, rating')
            .in('id', placeIds)
        : Promise.resolve({ data: [] }),
      postIds.length > 0
        ? supabase
            .from('posts')
            .select('id, title, category, city, user_name, likes')
            .in('id', postIds)
        : Promise.resolve({ data: [] }),
    ])

    const orderedPlaces = placeIds
      .map((id: string) => fullPlaces?.find((p) => p.id === id))
      .filter(Boolean)

    const orderedPosts = postIds
      .map((id: string) => fullPosts?.find((p) => p.id === id))
      .filter(Boolean)

    return NextResponse.json({
      answer: parsed.answer ?? '',
      places: orderedPlaces,
      posts: orderedPosts,
    })
  } catch (error) {
    console.error('AI search error:', error)
    return NextResponse.json({
      answer: '검색 중 오류가 발생했습니다',
      places: [],
      posts: [],
    })
  }
}
