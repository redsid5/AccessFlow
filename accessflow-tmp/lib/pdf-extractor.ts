import { PDFParse } from 'pdf-parse'
import { TriageSignals } from './types'

export async function extractPDF(buffer: Buffer): Promise<{
  text: string
  pageCount: number
  metadata: Record<string, string>
}> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  const [textResult, infoResult] = await Promise.all([
    parser.getText(),
    parser.getInfo(),
  ])
  await parser.destroy()

  const info: Record<string, string> = {}
  if (infoResult.info) {
    for (const [k, v] of Object.entries(infoResult.info)) {
      if (typeof v === 'string') info[k] = v
    }
  }

  return {
    text: textResult.text.slice(0, 4000),
    pageCount: infoResult.total,
    metadata: info,
  }
}

export function analyzeFilename(filename: string): Partial<TriageSignals> {
  const lower = filename.toLowerCase()

  const highValueKeywords = [
    'accommodation', 'application', 'financial-aid', 'finaid', 'registration',
    'handbook', 'policy', 'benefits', 'disability', 'housing', 'tuition',
    'syllabus', 'form', 'request', 'enrollment', 'admission'
  ]

  const lowValueKeywords = [
    'flyer', 'poster', 'agenda', 'event', 'newsletter', 'announcement',
    'archive', 'old', '2019', '2020', '2021', '2022', 'spring-2022',
    'fall-2021', 'recap', 'minutes-from'
  ]

  const missionCritical = highValueKeywords.some(k => lower.includes(k))
  const likelyLowValue = lowValueKeywords.some(k => lower.includes(k))

  return {
    missionCritical,
    likelyLowValue,
    betterAsHTML: likelyLowValue || lower.includes('form'),
    studentImpact: missionCritical
  }
}
