import { GoogleGenerativeAI } from '@google/generative-ai'
import { NormalizedIssue, ScopeLikelihood, Severity, PatternBucket } from './v2-types'
import { classifyPatternBucket, normalizeCanonicalKey } from './v2-pattern'
import { inferScope, contradictsScope } from './v2-scope'
import { getGeminiKey, withRetry, GEMINI_MODEL, EXTRACT_LIMITS } from './config'

interface LLMRawIssue {
  canonicalKey: string
  wcagCode?: string
  severity: string
  issueTitle: string
  issueSummary: string
  evidence: string[]
  signals: {
    publicFacing: boolean
    missionCritical: boolean
    timeSensitive: boolean
    lowValue: boolean
    betterAsHtml: boolean
    legalRisk: number
    studentImpact: number
    usageFrequency: number
    replaceability: number
    timeSensitivity: number
  }
  scopeInference: {
    likelihood: string
    confidence: number
    reasons: string[]
  }
  extractorConfidence: number
}

const SYSTEM_PROMPT = `You are an accessibility expert analyzing web content for WCAG 2.1 AA violations.

Your job is to identify distinct accessibility PATTERNS — not individual instances. For each pattern you find, output one issue object. Focus on patterns that repeat or originate from shared components (nav, templates, forms).

CANONICAL KEYS (use exactly these strings):
- nav-keyboard-trap
- missing-skip-link
- unlabeled-form-input
- icon-link-no-accessible-name
- search-control-not-button
- missing-alt-text-pattern
- pdf-missing-document-title
- pdf-untagged-content
- missing-heading-structure
- low-color-contrast
- auto-playing-media
- missing-captions
- table-no-header-markup
- button-empty-label
- focus-not-visible
- landmark-regions-missing

SIGNALS (all required):
- publicFacing: true if the page is accessible to non-authenticated users
- missionCritical: true if this content is needed for enrollment, financial aid, academic records, or emergency
- timeSensitive: true if related to deadlines, registration windows, or time-bound events
- lowValue: true if content is redundant, outdated, or replaced by a better digital format
- betterAsHtml: true if a PDF or document would work better as a web page
- legalRisk: 0-10, how severe the ADA/Section 508 legal exposure is (8+ = very high)
- studentImpact: 0-10, how much this blocks student task completion
- usageFrequency: 0-10, estimated how often this page/content is accessed
- replaceability: 0-10, how easily this content could be replaced or deleted (10 = trivially replaceable)
- timeSensitivity: 0-10, urgency of fixing this before a deadline

SCOPE INFERENCE:
- likelihood: "global" | "template" | "local"
  - global: issue is in a shared component (header, nav, footer, universal search) that appears on every page
  - template: issue appears in a reused template or CMS block that affects many pages
  - local: issue is specific to this page or document
- confidence: 0.0-0.95
- reasons: 1-3 short strings explaining why

EXTRACTOR CONFIDENCE: 0.0-1.0, how confident you are this is a real, distinct accessibility issue (not a false positive, not already counted in another issue).

Return ONLY valid JSON — no explanation, no markdown fences:
{
  "issues": [
    {
      "canonicalKey": "...",
      "wcagCode": "1.1.1",
      "severity": "critical|high|medium|low",
      "issueTitle": "...",
      "issueSummary": "...",
      "evidence": ["quote from content", "another quote"],
      "signals": {
        "publicFacing": true,
        "missionCritical": false,
        "timeSensitive": false,
        "lowValue": false,
        "betterAsHtml": false,
        "legalRisk": 7,
        "studentImpact": 6,
        "usageFrequency": 5,
        "replaceability": 2,
        "timeSensitivity": 3
      },
      "scopeInference": {
        "likelihood": "global",
        "confidence": 0.85,
        "reasons": ["Navigation appears on every page"]
      },
      "extractorConfidence": 0.9
    }
  ]
}`

export async function extractNormalizedIssues(
  text: string,
  sourceId: string,
  sourceTitle: string,
  sourceType: 'url' | 'pdf',
  pageUrl?: string,
): Promise<NormalizedIssue[]> {
  const truncated = text.slice(0, sourceType === 'pdf' ? EXTRACT_LIMITS.pdf : EXTRACT_LIMITS.url)

  const prompt = `${SYSTEM_PROMPT}

SOURCE: ${sourceTitle}
URL: ${pageUrl ?? 'n/a'}
TYPE: ${sourceType}

CONTENT:
${truncated}

Identify all distinct accessibility patterns present. Output 3-10 issues maximum. If fewer genuine issues exist, output only those.`

  const genAI = new GoogleGenerativeAI(getGeminiKey())
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  const raw = await withRetry(async () => {
    const result = await model.generateContent(prompt)
    return result.response.text()
  })

  const parsed = parseRawIssues(raw)
  const normalized = parsed.map((raw, idx) =>
    normalizeOne(raw, idx, sourceId, sourceTitle, sourceType, pageUrl)
  )

  // Re-run scope inference with cross-issue context
  const enriched = normalized.map(issue => ({
    ...issue,
    scopeInference: inferScope(issue, normalized),
    decisionSignals: {
      ...issue.decisionSignals,
      contradictions: contradictsScope({ ...issue, scopeInference: inferScope(issue, normalized) }),
    },
  }))

  return enriched
}

function parseRawIssues(raw: string): LLMRawIssue[] {
  try {
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return parsed
    if (parsed?.issues && Array.isArray(parsed.issues)) return parsed.issues
    return []
  } catch {
    return []
  }
}

function normalizeOne(
  raw: LLMRawIssue,
  idx: number,
  sourceId: string,
  sourceTitle: string,
  sourceType: 'url' | 'pdf',
  pageUrl?: string,
): NormalizedIssue {
  const canonicalKey = normalizeCanonicalKey(raw.canonicalKey ?? '')
  const patternBucket = classifyPatternBucket(raw.issueTitle ?? '', canonicalKey) as PatternBucket

  const signals = {
    publicFacing: raw.signals?.publicFacing ?? true,
    missionCritical: raw.signals?.missionCritical ?? false,
    timeSensitive: raw.signals?.timeSensitive ?? false,
    lowValue: raw.signals?.lowValue ?? false,
    betterAsHtml: raw.signals?.betterAsHtml ?? false,
    legalRisk: clamp(raw.signals?.legalRisk ?? 5, 0, 10),
    studentImpact: clamp(raw.signals?.studentImpact ?? 5, 0, 10),
    usageFrequency: clamp(raw.signals?.usageFrequency ?? 5, 0, 10),
    replaceability: clamp(raw.signals?.replaceability ?? 3, 0, 10),
    timeSensitivity: clamp(raw.signals?.timeSensitivity ?? 3, 0, 10),
  }

  const scopeInference = {
    likelihood: (raw.scopeInference?.likelihood ?? 'local') as ScopeLikelihood,
    confidence: clamp(raw.scopeInference?.confidence ?? 0.5, 0, 0.95),
    reasons: raw.scopeInference?.reasons ?? [],
  }

  return {
    id: `issue-${sourceId}-${canonicalKey}-${idx}-${Date.now()}`,
    sourceType,
    sourceId,
    sourceTitle,
    pageUrl,
    canonicalKey,
    wcagCode: raw.wcagCode,
    severity: normalizeSeverity(raw.severity),
    issueTitle: raw.issueTitle ?? canonicalKey,
    issueSummary: raw.issueSummary ?? '',
    evidence: Array.isArray(raw.evidence) ? raw.evidence.slice(0, 3) : [],
    patternBucket,
    signals,
    scopeInference,
    decisionSignals: {
      extractorConfidence: clamp(raw.extractorConfidence ?? 0.7, 0, 1),
      contradictions: [],
    },
  }
}

function normalizeSeverity(raw: string): Severity {
  const s = (raw ?? '').toLowerCase()
  if (s === 'critical') return 'critical'
  if (s === 'high') return 'high'
  if (s === 'low') return 'low'
  return 'medium'
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}
