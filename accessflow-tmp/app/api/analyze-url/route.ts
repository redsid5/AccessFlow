import { NextRequest, NextResponse } from 'next/server'
import { scrapeURL } from '@/lib/url-scraper'
import { classifyContent } from '@/lib/classifier'
import { Role } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { url, role } = await req.json() as { url: string; role: Role }

    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

    const scraped = await scrapeURL(url)

    const result = await classifyContent({
      type: 'url',
      value: scraped.text,
      role,
      metadata: {
        title: scraped.title,
        hasImages: scraped.hasImages,
        hasForms: scraped.hasForms,
        hasHeadings: scraped.hasHeadings,
      }
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('URL analysis error:', err)
    return NextResponse.json({ error: 'Failed to analyze URL' }, { status: 500 })
  }
}
