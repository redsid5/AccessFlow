import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { TechnicalReview } from '@/lib/types'
import { getGeminiKey, GEMINI_MODEL, EXTRACT_LIMITS, withRetry } from '@/lib/config'

export const maxDuration = 60

function getClient() {
  return new GoogleGenerativeAI(getGeminiKey())
}

function buildPrompt(label: string, contentType: 'url' | 'pdf', textSample: string, wcagContext?: string): string {
  return `You are a senior accessibility engineer producing a technical remediation report.

Content: ${label}
Type: ${contentType === 'url' ? 'Web page' : 'PDF document'}
${wcagContext ? `WCAG context from triage: ${wcagContext}` : ''}

Text sample:
---
${textSample.slice(0, EXTRACT_LIMITS.technicalReview)}
---

Identify 3–6 specific WCAG 2.1 AA issues. For each:
- title: short, specific (not "accessibility issue")
- wcag: exact criterion e.g. "WCAG 2.1 AA 1.3.1 Info and Relationships"
- severity: Critical | High | Medium | Low
- location: where in the content (optional)
- problem: what is broken, 1–2 sentences
- detailedReason: root cause + which users are blocked + real-world consequence, 3–5 sentences
- quickFix: one sentence, non-technical owner
- technicalFix: specific developer instruction
- codeExample: 2–5 line HTML snippet if relevant
- ownerSuggestion: who fixes this

Return ONLY valid JSON — no markdown, no keys outside this schema:
{
  "summary": "2–3 sentence technical summary",
  "scanConfidence": <60–95>,
  "issues": [
    {
      "id": "issue-1",
      "title": string,
      "wcag": string,
      "severity": "Critical" | "High" | "Medium" | "Low",
      "location": string | null,
      "problem": string,
      "detailedReason": string,
      "quickFix": string,
      "technicalFix": string,
      "codeExample": string | null,
      "ownerSuggestion": string
    }
  ]
}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      label?: unknown
      contentType?: unknown
      textSample?: unknown
      wcagContext?: unknown
    }

    if (typeof body.label !== 'string' || !body.label) {
      return NextResponse.json({ error: 'label is required' }, { status: 400 })
    }
    if (body.contentType !== 'url' && body.contentType !== 'pdf') {
      return NextResponse.json({ error: 'contentType must be "url" or "pdf"' }, { status: 400 })
    }
    if (typeof body.textSample !== 'string' || !body.textSample) {
      return NextResponse.json({ error: 'textSample is required' }, { status: 400 })
    }

    const wcagContext = typeof body.wcagContext === 'string' ? body.wcagContext : undefined
    const prompt = buildPrompt(body.label, body.contentType, body.textSample, wcagContext)

    const model = getClient().getGenerativeModel({ model: GEMINI_MODEL })
    const result = await withRetry(() => model.generateContent(prompt))
    const text = result.response.text().replace(/```json|```/g, '').trim()
    const review = JSON.parse(text) as TechnicalReview

    return NextResponse.json(review)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
