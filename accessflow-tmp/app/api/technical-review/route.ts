import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { TechnicalReview } from '@/lib/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { label, contentType, textSample, wcagContext } = await req.json() as {
      label: string
      contentType: 'url' | 'pdf'
      textSample: string
      wcagContext?: string
    }

    const prompt = `You are a senior accessibility engineer producing a technical remediation report for an accessibility specialist.

Content: ${label}
Type: ${contentType === 'url' ? 'Web page' : 'PDF document'}
${wcagContext ? `Initial WCAG context: ${wcagContext}` : ''}

Text sample:
---
${textSample.slice(0, 2000)}
---

Identify specific WCAG 2.1 AA accessibility issues in this content. For each issue provide:
- A clear title
- The exact WCAG criterion (e.g. "WCAG 2.1 AA 1.3.1 Info and Relationships")
- Severity: Critical | High | Medium | Low
- Location if identifiable (e.g. "form element", "heading structure", "page 2")
- What is broken (plain English, 1-2 sentences)
- Detailed reason: explain the technical root cause, which users are affected and how (e.g. screen reader users, keyboard-only users, low vision users), and the real-world consequence if not fixed. Be specific — name the technology, the failure mode, and the user harm. 3-5 sentences.
- Quick fix for a non-technical owner (one sentence)
- Technical fix for a developer (specific instruction)
- A short code example where applicable (HTML snippet, 2-5 lines max)
- Who should own the fix

Return ONLY a valid JSON object:
{
  "summary": "2-3 sentence technical summary of accessibility posture",
  "scanConfidence": <integer 60-95>,
  "issues": [
    {
      "id": "issue-1",
      "title": "short issue title",
      "wcag": "WCAG 2.1 AA X.X.X Criterion Name",
      "severity": "Critical" | "High" | "Medium" | "Low",
      "location": "optional location string",
      "problem": "plain 1-2 sentence description of what is broken",
      "detailedReason": "technical root cause, affected users, and real-world impact in 3-5 sentences",
      "quickFix": "one sentence non-technical fix",
      "technicalFix": "specific developer instruction",
      "codeExample": "optional short HTML snippet",
      "ownerSuggestion": "who should fix this"
    }
  ]
}

Return 3-6 issues maximum. Focus on the most impactful ones. No markdown fences. No explanation outside the JSON.`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text().replace(/```json|```/g, '').trim()
    const review = JSON.parse(text) as TechnicalReview

    return NextResponse.json(review)
  } catch (err) {
    console.error('Technical review error:', err)
    return NextResponse.json({ error: 'Technical review failed' }, { status: 500 })
  }
}
