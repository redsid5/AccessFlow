import { NextRequest, NextResponse } from 'next/server'
import { scrapeURL } from '@/lib/url-scraper'
import { classifyContent } from '@/lib/classifier'
import { Role } from '@/lib/types'

export const maxDuration = 60

const VALID_ROLES = new Set<Role>(['staff', 'faculty', 'admin', 'student'])

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { url?: unknown; role?: unknown }

    if (typeof body.url !== 'string' || !body.url.startsWith('http')) {
      return NextResponse.json({ error: 'Invalid URL — must start with http/https' }, { status: 400 })
    }

    const role: Role = VALID_ROLES.has(body.role as Role) ? (body.role as Role) : 'staff'

    const scraped = await scrapeURL(body.url)
    const result = await classifyContent({
      type: 'url',
      value: scraped.text,
      role,
      metadata: {
        title: scraped.title,
        hasImages: scraped.hasImages,
        hasForms: scraped.hasForms,
        hasHeadings: scraped.hasHeadings,
      },
    })

    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
