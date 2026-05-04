import { NextRequest, NextResponse } from 'next/server'
import { scrapeURL } from '@/lib/url-scraper'
import { extractNormalizedIssues } from '@/lib/v2-normalizer'
import { clusterIssues } from '@/lib/v2-cluster'
import { generateFixOpportunities } from '@/lib/v2-fix'
import { AnalysisV2Result } from '@/lib/v2-types'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { url?: unknown; pdfText?: unknown; sourceTitle?: unknown; sourceId?: unknown }

    let text: string
    let sourceTitle: string
    let sourceId: string
    let pageUrl: string | undefined
    const sourceType: 'url' | 'pdf' = typeof body.pdfText === 'string' ? 'pdf' : 'url'

    if (sourceType === 'url') {
      if (typeof body.url !== 'string' || !body.url.startsWith('http')) {
        return NextResponse.json({ error: 'Invalid URL — must start with http/https' }, { status: 400 })
      }
      const scraped = await scrapeURL(body.url)
      text = scraped.text
      sourceTitle = scraped.title || body.url
      pageUrl = body.url
      sourceId = encodeSourceId(body.url)
    } else {
      text = body.pdfText as string
      sourceTitle = typeof body.sourceTitle === 'string' ? body.sourceTitle : 'PDF Document'
      sourceId = typeof body.sourceId === 'string' ? body.sourceId : encodeSourceId(sourceTitle)
    }

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: 'Insufficient content to analyze' }, { status: 422 })
    }

    const rawIssues = await extractNormalizedIssues(text, sourceId, sourceTitle, sourceType, pageUrl)

    if (rawIssues.length === 0) {
      const result: AnalysisV2Result = {
        sourceId,
        sourceTitle,
        sourceType,
        pageUrl,
        rawIssues: [],
        fixOpportunities: [],
        compressionRatio: 0,
      }
      return NextResponse.json(result)
    }

    const clusters = clusterIssues(rawIssues)
    const fixOpportunities = generateFixOpportunities(clusters)

    const result: AnalysisV2Result = {
      sourceId,
      sourceTitle,
      sourceType,
      pageUrl,
      rawIssues,
      fixOpportunities,
      compressionRatio: rawIssues.length / fixOpportunities.length,
    }

    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function encodeSourceId(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/https?:\/\//, '')
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 64)
}
