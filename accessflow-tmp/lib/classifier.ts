import { GoogleGenerativeAI } from '@google/generative-ai'
import { AnalysisInput, TriageResult } from './types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const ROLE_CONTEXT = {
  staff: 'a university digital accessibility specialist who understands WCAG but needs operational clarity',
  faculty: 'a faculty member who created this content and needs to understand the impact on their students',
  admin: 'a department administrator responsible for content compliance who has no technical background',
  student: 'a student worker assisting with accessibility remediation who needs very simple, direct instructions'
}

const ROLE_TONE = {
  staff: 'You may include brief WCAG context (e.g. WCAG 2.1 AA) but keep decisions plain and operational.',
  faculty: 'Frame impact in terms of student experience. Avoid jargon entirely. Be direct but not alarming.',
  admin: 'Use plain language. Focus on who needs to act and what the deadline risk is. No technical terms.',
  student: 'Use very simple, clear language. One sentence max for "why". Give them one thing to do.'
}

export async function classifyContent(input: AnalysisInput): Promise<TriageResult> {
  const roleDesc = ROLE_CONTEXT[input.role]
  const roleTone = ROLE_TONE[input.role]

  const prompt = `You are an accessibility triage assistant for a university digital accessibility office.

The person reviewing this content is: ${roleDesc}
Tone guidance: ${roleTone}

Writing style for "why" and "action" fields:
- Be direct. No corporate filler ("conduct a full audit", "ensure compliance with").
- One sharp sentence beats two vague ones.
- Good example: "Critical student-facing service page. High disability impact, active usage, and low replaceability make remediation the right path."
- Bad example: "This content may present challenges for users with disabilities and should be reviewed for accessibility compliance."

Content type: ${input.type === 'url' ? 'Web page' : 'PDF document'}
${input.filename ? `Filename: ${input.filename}` : ''}
${input.metadata?.pageCount ? `Pages: ${input.metadata.pageCount}` : ''}
${input.metadata?.hasForms ? 'Contains form fields: yes' : ''}
${input.metadata?.hasImages ? 'Contains images: yes' : ''}

Content text sample:
---
${input.value.slice(0, 3000)}
---

University accessibility context:
- Public universities face DOJ Title II compliance pressure (April 2026 deadline)
- Higher-ed guidance prioritizes: Remove first → Replace second → Remediate third
- Mission-critical content: financial aid, registration, disability services, housing, admissions, tuition, graduation, accommodation forms, student handbooks
- Low-value content: old event flyers, archived announcements, past newsletters, outdated promotional materials
- PDFs that are purely informational should be replaced with HTML, not remediated

Classify this content and return ONLY a valid JSON object with these exact fields:

{
  "decision": "fix" | "review" | "delete",
  "priority": "High" | "Medium" | "Low",
  "contentDescription": "short description under 8 words",
  "why": "1-2 sharp sentences. No WCAG codes. No filler. Write for ${input.role}.",
  "action": "one specific next step. Start with a verb. No hedging.",
  "owner": "one of: Accessibility office | Web team | Department content owner | Document owner | Accessibility office + Web team",
  "confidence": <integer 60-98>,
  "signals": {
    "publicFacing": <boolean>,
    "studentImpact": <boolean>,
    "betterAsHTML": <boolean>,
    "likelyLowValue": <boolean>,
    "timeSensitive": <boolean>,
    "missionCritical": <boolean>
  },
  "priorityScore": {
    "studentImpact": <integer 0-10>,
    "legalRisk": <integer 0-10>,
    "usageFrequency": <integer 0-10>,
    "contentReplaceability": <integer 0-10, where 10 = very hard to replace>,
    "timeSensitivity": <integer 0-10>,
    "total": <integer 0-100, weighted sum>
  },
  "estimatedEffort": "10 min" | "2 hours" | "multi-team project",
  "usageSignal": "high-traffic" | "seasonal" | "archived" | "unknown",
  "wcagContext": "only include if role is staff, else empty string",
  "roleNote": "one sentence for this reviewer's specific next action"
}

Decision rules (apply in order):
1. Public-facing AND mission-critical AND currently active → "fix", High priority
2. Outdated, expired, low-value, or better as HTML with no remediation value → "delete", Low priority
3. Ownership unclear, value uncertain, or cannot safely recommend action → "review", Medium priority

Priority score guidance:
- total = (studentImpact * 2 + legalRisk * 2 + usageFrequency + contentReplaceability + timeSensitivity * 2) / 1.0, rounded to 0-100
- High priority items should score 70+
- Review items 40-69
- Delete items under 40

Return only the JSON object. No markdown fences. No explanation outside the JSON.`

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const result = await model.generateContent(prompt)
  const text = result.response.text().replace(/```json|```/g, '').trim()

  return JSON.parse(text) as TriageResult
}
