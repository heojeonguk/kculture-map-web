import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  try {
    const { prompt, locale } = await request.json()

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const result = message.content[0].type === 'text' ? message.content[0].text : ''

    return NextResponse.json({ result })
  } catch (error) {
    console.error('AI recommend error:', error)
    return NextResponse.json(
      { error: 'Failed to get recommendation' },
      { status: 500 }
    )
  }
}
