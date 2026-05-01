import { GoogleGenerativeAI } from '@google/generative-ai'
import { AnalysisInput, TriageResult } from './types'
import { getGeminiKey, GEMINI_MODEL } from './config'
import { SCORING_WEIGHTS, computePriorityTotal } from './scoring-config'

function getClient() {
  return new GoogleGenerativeAI(getGeminiKey())
}

const ROLE_CONTEXT: Record<string, string> = {
  staff: 'a university digital accessibility specialist who understands WCAG but needs operational clarity',
  faculty: 'a faculty member who created this content and needs to understand the impact on their students',
  admin: 'a department administrator responsible for content compliance — no technical background',
  student: 'a student worker assisting with remediation who needs very simple, direct instructions',
}

const ROLE_TONE: Record<string, string> = {
  staff: 'Include brief WCAG context if relevant. Keep decisions operational.',
  faculty: 'Frame impact in terms of student experience. No jargon.',
  admin: 'Plain language only. Focus on who acts next and the deadline risk.',
  student: 'One sentence max for "why". Give them one thing to do.',
}

function buildPrompt(input: AnalysisInput): string {
  const roleDesc = ROLE_CONTEXT[input.role]
  const roleTone = ROLE_TONE[input.role]
  const { studentImpact, legalRisk, usageFrequency, contentReplaceability, timeSensitivity } = SCORING_WEIGHTS

  return `You are an accessibility triage assistant for a university digital accessibility office.

Reviewer: ${roleDesc}
Tone: ${roleTone}

Content type: ${input.type === 'url' ? 'Web page' : 'PDF document'}
${input.filename ? `Filename: ${input.filename}` : ''}
${input.metadata?.pageCount ? `Pages: ${input.metadata.pageCount}` : ''}
${input.metadata?.hasForms ? 'Has form fields: yes' : ''}
${input.metadata?.hasImages ? 'Has images: yes' : ''}

Content sample:
---
${input.value.slice(0, 3000)}
---

Decision rules (apply in order):
1. Public-facing + mission-critical + active → "fix", High priority
2. Outdated / low-value / better as HTML → "delete", Low priority
3. Ownership unclear / value uncertain → "review", Medium priority

Mission-critical: financial aid, registration, disability services, housing, admissions, tuition, graduation, accommodation forms, student handbooks
Low-value: old event flyers, archived announcements, past newsletters, promotional materials

Scoring weights: studentImpact×${studentImpact}, legalRisk×${legalRisk}, usageFrequency×${usageFrequency}, replaceability×${contentReplaceability}, timeSensitivity×${timeSensitivity}
Each subscore is 0–10. Do NOT compute total — that is calculated server-side.

Writing rules:
- "why": 1–2 sharp sentences. No WCAG codes. No filler ("ensure compliance", "conduct a review").
- "action": Start with a verb. One clear next step. No hedging.
- Bad: "This content may present challenges and should be reviewed for accessibility compliance."
- Good: "Accommodation form with broken field labeling — screen readers cannot complete it."

Return ONLY a valid JSON object:
{
  "decision": "fix" | "review" | "delete",
  "priority": "High" | "Medium" | "Low",
  "contentDescription": "<8 words",
  "why": "1–2 sentences",
  "action": "verb-first instruction",
  "owner": "Accessibility office" | "Web team" | "Department content owner" | "Document owner" | "Accessibility office + Web team",
  "confidence": <60–98>,
  "signals": {
    "publicFacing": boolean,
    "studentImpact": boolean,
    "betterAsHTML": boolean,
    "likelyLowValue": boolean,
    "timeSensitive": boolean,
    "missionCritical": boolean
  },
  "priorityScore": {
    "studentImpact": <0–10>,
    "legalRisk": <0–10>,
    "usageFrequency": <0–10>,
    "contentReplaceability": <0–10>,
    "timeSensitivity": <0–10>
  },
  "estimatedEffort": "10 min" | "2 hours" | "multi-team project",
  "usageSignal": "high-traffic" | "seasonal" | "archived" | "unknown",
  "wcagContext": "<staff only, else empty string>",
  "roleNote": "<one sentence for this reviewer's next action>"
}

No markdown fences. No keys outside this schema.`
}

export async function classifyContent(input: AnalysisInput): Promise<TriageResult> {
  const model = getClient().getGenerativeModel({ model: GEMINI_MODEL })
  const result = await model.generateContent(buildPrompt(input))
  const text = result.response.text().replace(/```json|```/g, '').trim()

  const raw = JSON.parse(text) as Omit<TriageResult, 'priorityScore'> & {
    priorityScore: Omit<TriageResult['priorityScore'], 'total'>
  }

  const total = computePriorityTotal(raw.priorityScore)

  return {
    ...raw,
    priorityScore: { ...raw.priorityScore, total },
  }
}
