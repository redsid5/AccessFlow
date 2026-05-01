import * as cheerio from 'cheerio'
import { TriageSignals } from './types'

export async function scrapeURL(url: string): Promise<{
  title: string
  text: string
  hasImages: boolean
  hasForms: boolean
  hasHeadings: boolean
  pdfLinkCount: number
  signals: Partial<TriageSignals>
}> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'AccessFlow-Triage-Bot/1.0' },
    signal: AbortSignal.timeout(8000)
  })
  if (!res.ok) {
    throw new Error(`URL returned ${res.status} — cannot triage unreachable content`)
  }
  const html = await res.text()
  const $ = cheerio.load(html)

  const title = $('title').text() || $('h1').first().text() || ''
  const bodyText = $('body').text().replace(/\s+/g, ' ').slice(0, 3000)

  const criticalKeywords = [
    'financial aid', 'tuition', 'registration', 'enrollment', 'deadline',
    'disability services', 'accommodation', 'housing', 'admission', 'fafsa',
    'payment', 'graduation', 'transcript', 'schedule'
  ]
  const lowValueKeywords = [
    'event recap', 'archive', 'newsletter', 'announcement from', 'past event'
  ]

  const combined = (title + ' ' + bodyText).toLowerCase()

  return {
    title,
    text: bodyText,
    hasImages: $('img').length > 0,
    hasForms: $('form').length > 0,
    hasHeadings: $('h1, h2, h3').length > 0,
    pdfLinkCount: $('a[href$=".pdf"]').length,
    signals: {
      missionCritical: criticalKeywords.some(k => combined.includes(k)),
      likelyLowValue: lowValueKeywords.some(k => combined.includes(k)),
      publicFacing: true,
      betterAsHTML: $('a[href$=".pdf"]').length > 3
    }
  }
}
