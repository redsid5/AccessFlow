# AccessFlow — Claude Code Build Prompt
# Copy this entire file into Claude Code (VS Code) to build the MVP

---

## WHAT YOU ARE BUILDING

Build a production-quality web app called **AccessFlow** — an accessibility triage and decision assistant for university digital accessibility offices.

This is NOT a scanner. It is a decision layer.

The core insight that makes this product unique:
> Universities already have accessibility scanners (WAVE, axe, Lighthouse, Siteimprove). What they don't have is a tool that tells staff **what to do next** — in plain English, by role, with a clear decision. That's the gap this fills.

The triage philosophy baked into every decision:
1. **Remove first** — is this content still needed?
2. **Replace second** — should this be HTML instead of a PDF?
3. **Remediate third** — only fix what must stay and can't be replaced

---

## DESIGN MANDATE — WHITE SCREEN, BLACK TEXT, NOTHING HEAVY

White background. Black text. That's the palette. Everything else is just spacing and type doing the work.

**What this means concretely:**

- `background: #ffffff` everywhere. No gray surfaces, no colored cards, no dark sidebars.
- `color: #111111` for all text. Muted gray (`#888`) only for labels and secondary info.
- No shadows. No gradients. No colored badges or pills.
- Borders: 1px solid #e5e5e5 or #000 only. Used sparingly to separate sections.
- Border-radius: 4px max on inputs and buttons. Cards get 0px or 4px. Nothing "rounded-xl".
- Buttons: black fill, white text. Or white fill, black 1px border. That's it.

**Typography:**
- IBM Plex Mono for labels, codes, tags, the triage bar, anything that needs to feel precise
- DM Sans or Sora for body copy and headings
- NOT Inter. NOT Space Grotesk. NOT system-ui.
- Size hierarchy via weight and size only — no color to create hierarchy

**Layout:**
- Single column. Max-width 680px centered.
- Generous vertical spacing between sections (2–3rem gaps).
- No sidebars, no multi-column grids on the main layout.
- The result card is just a bordered rectangle with clear label/value rows inside.

**Things that are banned:**
- Any colored surface (blue cards, amber alerts, green badges)
- Drop shadows (`box-shadow` anywhere except a subtle focus ring on inputs)
- Gradient anything
- Emoji in the UI
- Spinner animations — just text: "Analyzing..."
- "Powered by AI" or any mention of the underlying model

**The feel:** A tool a developer built on a weekend for a client they respected. Quiet. Functional. Typography-led.

---


## UNIQUE DIFFERENTIATORS (know these deeply — they inform every design decision)

### 1. Role-based plain language output
Every other tool outputs WCAG criterion codes (e.g. "1.1.1 Non-text Content — Level A"). AccessFlow outputs:
- "This image needs a description so screen reader users know what it shows."
- "This PDF likely has broken reading order — a screen reader will read it out of sequence."
- "This form should be an HTML page, not a PDF."

The role selector changes output tone and vocabulary. A student worker sees simplified language. An accessibility specialist sees more technical context. A faculty member sees impact framing ("your students who use screen readers cannot access this").

### 2. Triage-first, not audit-first
Most tools generate a list of every issue found. AccessFlow generates ONE decision per content item:
- **Fix now** — public-facing, student-critical, active deadlines
- **Needs review** — unclear value, unclear ownership, low confidence
- **Delete / replace** — outdated, low-value, event flyers, better as HTML

This mirrors how real accessibility teams actually work under backlog pressure.

### 3. Ownership routing
Every result includes a suggested owner: Accessibility office / Web team / Department content owner / Document owner. No other consumer tool does this. It's the handoff layer that makes the tool operationally useful.

### 4. The Remove → Replace → Remediate principle is visible in the UI
This is the highest-leverage insight from current higher-ed accessibility guidance (DOJ Title II, Siteimprove, UMKC, Ohio State). Most teams try to fix everything. The right answer is to remove or replace first. AccessFlow makes this explicit and teaches it through use.

### 5. Designed for non-technical users
The target users are not developers. They are student workers, faculty, and department administrators who have been asked to "make their content accessible" with no training. AccessFlow is the first accessibility tool they can actually use without reading documentation.

### 6. Academic document awareness
The AI prompt is tuned for university document types: syllabi, accommodation request forms, financial aid pages, registration forms, housing applications, student handbooks, event flyers, course schedules. It understands the difference between mission-critical content and low-value archive content.

---

## TECH STACK

```
Framework:     Next.js 14 (App Router)
Language:      TypeScript
Styling:       Tailwind CSS
PDF parsing:   pdf-parse (server-side) + pdfjs-dist (fallback)
AI layer:      Anthropic Claude API (claude-sonnet-4-20250514)
URL analysis:  Cheerio + node-fetch for lightweight DOM scraping
Deployment:    Vercel-ready (no database required)
Env vars:      ANTHROPIC_API_KEY
```

---

## PROJECT STRUCTURE

```
accessflow/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Main app page
│   ├── globals.css
│   └── api/
│       ├── analyze-url/
│       │   └── route.ts            # URL scraping + Claude classification
│       └── analyze-pdf/
│           └── route.ts            # PDF parsing + Claude classification
├── components/
│   ├── Header.tsx
│   ├── InputCard.tsx               # Tab switcher: URL | PDF
│   ├── RoleSelector.tsx            # Staff / Faculty / Admin / Student worker
│   ├── ResultCard.tsx              # The triage decision card
│   ├── SignalBadges.tsx            # Public-facing, Student impact, etc.
│   ├── HowItDecides.tsx            # Explanation panel at bottom
│   └── DemoExamples.tsx            # Pre-loaded demo cases
├── lib/
│   ├── classifier.ts               # Decision logic + Claude prompt
│   ├── pdf-extractor.ts            # PDF text + metadata extraction
│   ├── url-scraper.ts              # URL fetch + DOM analysis
│   ├── heuristics.ts               # Rule-based pre-classification
│   └── types.ts                    # Shared TypeScript types
├── public/
│   └── demo-pdfs/                  # 3 sample PDFs for demo
├── .env.local                      # ANTHROPIC_API_KEY
├── README.md
└── package.json
```

---

## TYPES (lib/types.ts)

```typescript
export type Decision = 'fix' | 'review' | 'delete'
export type Priority = 'High' | 'Medium' | 'Low'
export type Role = 'staff' | 'faculty' | 'admin' | 'student'
export type ContentType = 'url' | 'pdf'

export interface TriageSignals {
  publicFacing: boolean
  studentImpact: boolean
  betterAsHTML: boolean
  likelyLowValue: boolean
  timeSensitive: boolean
  missionCritical: boolean
}

export interface TriageResult {
  decision: Decision
  priority: Priority
  contentDescription: string       // e.g. "Accommodation request form PDF"
  why: string                      // 1-2 plain English sentences
  action: string                   // One specific next step
  owner: string                    // Who should act
  confidence: number               // 60-98
  signals: TriageSignals
  wcagContext?: string             // Only shown to staff/specialists
  roleNote?: string                // Role-specific framing
}

export interface AnalysisInput {
  type: ContentType
  value: string                    // URL string or extracted PDF text
  filename?: string                // Original PDF filename
  role: Role
  metadata?: {
    title?: string
    pageCount?: number
    hasImages?: boolean
    hasForms?: boolean
    hasHeadings?: boolean
    language?: string
    lastModified?: string
  }
}
```

---

## PDF EXTRACTION (lib/pdf-extractor.ts)

```typescript
import pdfParse from 'pdf-parse'

export async function extractPDF(buffer: Buffer): Promise<{
  text: string
  pageCount: number
  metadata: Record<string, string>
}> {
  const data = await pdfParse(buffer)
  return {
    text: data.text.slice(0, 4000), // First 4k chars is enough for classification
    pageCount: data.numpages,
    metadata: data.info || {}
  }
}

// Heuristic signals from filename alone (used as fallback or pre-signal)
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
```

---

## URL SCRAPER (lib/url-scraper.ts)

```typescript
import * as cheerio from 'cheerio'

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
  const html = await res.text()
  const $ = cheerio.load(html)
  
  const title = $('title').text() || $('h1').first().text() || ''
  const bodyText = $('body').text().replace(/\s+/g, ' ').slice(0, 3000)
  
  // Keyword signals for classification
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
      publicFacing: true, // assume true for scrapable URLs
      betterAsHTML: $('a[href$=".pdf"]').length > 3
    }
  }
}
```

---

## CLASSIFIER + CLAUDE PROMPT (lib/classifier.ts)

This is the core of the product. The prompt is tuned for academic content and role-based output.

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { AnalysisInput, TriageResult } from './types'

const client = new Anthropic()

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
- Mission-critical content includes: financial aid, registration, disability services, housing, admissions, tuition, graduation, accommodation forms, student handbooks
- Low-value content includes: old event flyers, archived announcements, past newsletters, outdated promotional materials
- PDFs that are purely informational should often be replaced with accessible HTML pages instead of remediated

Classify this content and return ONLY a valid JSON object with these exact fields:

{
  "decision": "fix" | "review" | "delete",
  "priority": "High" | "Medium" | "Low",
  "contentDescription": "short description under 8 words",
  "why": "1-2 plain English sentences. No WCAG codes. Write for ${input.role}.",
  "action": "one specific, actionable next step (1-2 sentences)",
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
  "wcagContext": "optional: only include if role is staff, else empty string",
  "roleNote": "one sentence specific to the reviewer's role and what they should do"
}

Decision rules (apply in this order):
1. If content is public-facing AND mission-critical AND currently active → "fix", High priority
2. If content is outdated, expired, low-value, or better as HTML with no remediation value → "delete", Low priority  
3. If ownership is unclear, value is uncertain, or you cannot safely recommend action → "review", Medium priority

Return only the JSON object. No markdown fences. No explanation outside the JSON.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = message.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
    .replace(/```json|```/g, '')
    .trim()

  return JSON.parse(text) as TriageResult
}
```

---

## API ROUTES

### app/api/analyze-pdf/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { extractPDF, analyzeFilename } from '@/lib/pdf-extractor'
import { classifyContent } from '@/lib/classifier'
import { Role } from '@/lib/types'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const role = (formData.get('role') as Role) || 'staff'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const { text, pageCount, metadata } = await extractPDF(buffer)
  const filenameSignals = analyzeFilename(file.name)

  const result = await classifyContent({
    type: 'pdf',
    value: text,
    filename: file.name,
    role,
    metadata: {
      pageCount,
      title: metadata.Title,
      language: metadata.Language,
      lastModified: metadata.ModDate,
      ...filenameSignals
    }
  })

  return NextResponse.json(result)
}
```

### app/api/analyze-url/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { scrapeURL } from '@/lib/url-scraper'
import { classifyContent } from '@/lib/classifier'
import { Role } from '@/lib/types'

export async function POST(req: NextRequest) {
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
}
```

---

## RESULT CARD COMPONENT (components/ResultCard.tsx)

The result card must answer four questions in under 30 seconds:
1. How urgent is this?
2. What should we do?
3. Why?
4. Who owns the next step?

```tsx
import { TriageResult, Role } from '@/lib/types'

const DECISION_CONFIG = {
  fix: {
    label: 'Fix now',
    color: 'amber',
    bg: 'bg-amber-50',
    border: 'border-l-amber-400',
    text: 'text-amber-900'
  },
  review: {
    label: 'Needs review',
    color: 'blue',
    bg: 'bg-blue-50',
    border: 'border-l-blue-400',
    text: 'text-blue-900'
  },
  delete: {
    label: 'Delete / replace',
    color: 'green',
    bg: 'bg-green-50',
    border: 'border-l-green-500',
    text: 'text-green-900'
  }
}

const PRIORITY_BADGE = {
  High: 'bg-red-100 text-red-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-gray-100 text-gray-700'
}

export function ResultCard({ result, label, role }: {
  result: TriageResult
  label: string
  role: Role
}) {
  const config = DECISION_CONFIG[result.decision]

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs text-gray-400 font-mono mb-1">Analyzed content</p>
        <p className="font-semibold text-gray-900 text-base">{label}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className={`text-xs font-mono px-2 py-1 rounded ${PRIORITY_BADGE[result.priority]}`}>
            {result.priority} priority
          </span>
          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 font-mono">
            {result.contentDescription}
          </span>
          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500 font-mono">
            {result.confidence}% confidence
          </span>
        </div>
      </div>

      {/* Decision block */}
      <div className={`px-5 py-4 border-l-4 ${config.bg} ${config.border}`}>
        <p className={`text-xs font-mono font-semibold uppercase tracking-widest mb-1 ${config.text}`}>
          Decision
        </p>
        <p className={`text-2xl font-bold ${config.text}`}>{config.label}</p>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">Why this decision</p>
          <p className="text-sm text-gray-700 leading-relaxed">{result.why}</p>
        </div>

        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">Recommended action</p>
          <p className="text-sm text-gray-900 font-medium leading-relaxed">{result.action}</p>
        </div>

        {result.roleNote && (
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <p className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">For you specifically</p>
            <p className="text-sm text-gray-700">{result.roleNote}</p>
          </div>
        )}

        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">Suggested owner</p>
          <span className="inline-block bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1 rounded-md">
            {result.owner}
          </span>
        </div>

        {result.wcagContext && role === 'staff' && (
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">WCAG context</p>
            <p className="text-xs text-gray-500 font-mono">{result.wcagContext}</p>
          </div>
        )}

        {/* Signals */}
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Reasoning signals</p>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'publicFacing', label: 'Public-facing' },
              { key: 'studentImpact', label: 'Student impact' },
              { key: 'betterAsHTML', label: 'Better as HTML' },
              { key: 'likelyLowValue', label: 'Likely low-value' },
              { key: 'timeSensitive', label: 'Time-sensitive' },
              { key: 'missionCritical', label: 'Mission-critical' }
            ].map(s => (
              <span
                key={s.key}
                className={`text-xs px-2 py-1 rounded font-mono ${
                  result.signals[s.key as keyof typeof result.signals]
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {result.signals[s.key as keyof typeof result.signals] ? '✓ ' : ''}{s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Confidence bar */}
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
            Confidence — {result.confidence}%
          </p>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-800 rounded-full transition-all duration-700"
              style={{ width: `${result.confidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          This tool supports prioritization. It does not replace a full accessibility audit or legal review.
        </p>
      </div>
    </div>
  )
}
```

---

## DEMO EXAMPLES

Include these three pre-loaded demo cases. They must work without any API call (use mock data):

```typescript
// lib/demo-cases.ts
export const DEMO_CASES = [
  {
    id: 'flyer',
    type: 'pdf' as const,
    label: 'Spring 2022 event flyer.pdf',
    description: 'Old event flyer — typical low-value archive PDF',
    result: {
      decision: 'delete',
      priority: 'Low',
      contentDescription: 'Past event flyer PDF',
      why: 'This is a time-expired event flyer. The event has already passed, so remediating it offers no benefit to current students or staff.',
      action: 'Remove from any public-facing links immediately. If needed for institutional records, move it to an internal archive folder that is not publicly indexed.',
      owner: 'Department content owner',
      confidence: 94,
      signals: { publicFacing: true, studentImpact: false, betterAsHTML: true, likelyLowValue: true, timeSensitive: false, missionCritical: false },
      wcagContext: '',
      roleNote: 'You can safely mark this for deletion. No remediation time required.'
    }
  },
  {
    id: 'accommodation',
    type: 'pdf' as const,
    label: 'disability-accommodation-request.pdf',
    description: 'Accommodation form — highest-priority document type',
    result: {
      decision: 'fix',
      priority: 'High',
      contentDescription: 'Accommodation request form PDF',
      why: 'Accommodation request forms are among the most legally and ethically urgent documents on campus. An inaccessible form directly prevents students with disabilities from accessing the services they are legally entitled to.',
      action: 'Remediate immediately or replace with an accessible HTML web form. Verify reading order, field labels, tab order, and that all form fields are properly tagged. Set a 2-week deadline.',
      owner: 'Accessibility office + Web team',
      confidence: 97,
      signals: { publicFacing: true, studentImpact: true, betterAsHTML: true, likelyLowValue: false, timeSensitive: true, missionCritical: true },
      wcagContext: 'WCAG 2.1 AA: 1.3.1 Info and Relationships, 4.1.2 Name, Role, Value — form fields must be programmatically labeled',
      roleNote: 'This should be on your highest-priority remediation list. Assign an owner today.'
    }
  },
  {
    id: 'tuition',
    type: 'url' as const,
    label: 'university.edu/tuition-payment-deadlines',
    description: 'Tuition deadline page — active, high-stakes content',
    result: {
      decision: 'fix',
      priority: 'High',
      contentDescription: 'Tuition payment deadline page',
      why: 'Tuition and payment deadline pages control access to enrollment. A student who cannot access this information due to an accessibility barrier may incur late fees or lose their class schedule.',
      action: 'Audit heading structure, keyboard navigation, and any embedded PDFs or forms on this page before the next payment deadline. Assign the web team as primary owner.',
      owner: 'Web team',
      confidence: 91,
      signals: { publicFacing: true, studentImpact: true, betterAsHTML: false, likelyLowValue: false, timeSensitive: true, missionCritical: true },
      wcagContext: 'WCAG 2.1 AA: 1.3.1, 2.4.6 Headings and Labels, 2.1.1 Keyboard — deadline pages often have complex table structures',
      roleNote: 'Flag this for your next sprint. Time pressure makes this urgent.'
    }
  }
]
```

---

## HEADER + TRIAGE PRINCIPLE BAR

The triage order must be visible at all times. It is the main product insight:

```tsx
export function Header() {
  return (
    <header className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-mono text-xs bg-gray-900 text-white px-2 py-1 rounded tracking-wide">
          AccessFlow
        </span>
        <span className="text-xs text-gray-400 font-mono">30-second triage</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">
        Access Decision Assistant
        <span className="block text-gray-400 font-normal">Not a scanner. A decision layer.</span>
      </h1>

      <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-lg">
        Paste a URL or upload a PDF. Get one clear decision — fix it, review it, or remove it.
        Designed for campus staff with no WCAG expertise required.
      </p>

      {/* Triage principle bar — this is the core differentiator made visible */}
      <div className="mt-4 flex items-center gap-2 bg-gray-900 text-gray-300 px-4 py-2.5 rounded-lg font-mono text-xs max-w-max flex-wrap">
        <span className="text-gray-500">Triage order:</span>
        <span className="text-white font-medium">1. Remove</span>
        <span className="text-gray-600">→</span>
        <span className="text-white font-medium">2. Replace</span>
        <span className="text-gray-600">→</span>
        <span className="text-white font-medium">3. Remediate</span>
      </div>
    </header>
  )
}
```

---

## README (include this verbatim)

```markdown
# AccessFlow — Access Decision Assistant

**Most accessibility tools generate reports. This one reduces decision time.**

## What it does

AccessFlow is a triage-first accessibility tool for university digital accessibility offices.
You paste a URL or upload a PDF. You get one decision: fix it, review it, or delete it.

It is NOT a scanner. It is a decision layer on top of content workflows.

## Why this framing matters

Universities already have scanners (WAVE, axe, Lighthouse, Siteimprove). What they don't have is:
- A tool that tells non-technical staff what to DO, not just what's wrong
- Output that changes based on who is reading it (faculty vs. student worker vs. specialist)
- A triage philosophy that says: Remove first. Replace second. Remediate third.

That last point is directly aligned with current DOJ Title II guidance and higher-ed accessibility
best practice. Most teams try to fix everything. The right answer is to remove or replace first.

## The core insight

> "Remove first → Replace second → Remediate third"

This principle is visible in the UI because it is the main thing that separates AccessFlow
from every other accessibility tool. It teaches the right mental model through use.

## What is intentionally out of scope

- Full WCAG audit reports (use axe-core or WAVE for that)
- Authentication or user accounts
- Department dashboards or analytics
- Notifications or workflow automation
- Legal compliance certification

This is a decision-support MVP. It demonstrates problem understanding, not enterprise completeness.

## How to run locally

```bash
git clone <repo>
cd accessflow
npm install
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
```

Open http://localhost:3000

## How to demo in an interview

1. Open the app
2. Say: "I didn't build another scanner. Universities already have those."
3. Click the "disability-accommodation-request.pdf" demo
4. Point to the decision card: "This answers four questions in under 30 seconds — how urgent, what to do, why, and who owns it."
5. Switch the role selector to "Faculty" and re-run
6. Say: "The same content produces different language depending on who's reading it."
7. Point to the triage bar: "Remove first, replace second, remediate third — that's the insight that current higher-ed guidance actually recommends, and no other tool makes it visible."

## Tech stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Anthropic Claude API (claude-sonnet-4-20250514)
- pdf-parse for PDF extraction
- Cheerio for URL scraping

## Deployment

Vercel-ready. Add ANTHROPIC_API_KEY to environment variables and deploy.
```

---

## BUILD INSTRUCTIONS FOR CLAUDE CODE

1. Scaffold the Next.js project: `npx create-next-app@latest accessflow --typescript --tailwind --app`
2. Install dependencies: `npm install @anthropic-ai/sdk pdf-parse cheerio`
3. Install types: `npm install -D @types/pdf-parse`
4. Create all files in the structure above
5. Add `ANTHROPIC_API_KEY=your_key_here` to `.env.local`
6. Ensure the three demo cases work WITHOUT making any API calls (use the mock data from `lib/demo-cases.ts`)
7. Ensure real URL and PDF inputs DO call the API routes
8. Test with the three built-in demos before running any live inputs
9. The app must be fully functional at `localhost:3000` with `npm run dev`


## QUALITY BAR

Two tests. Both must pass.

**Test 1 — product understanding:**
When someone uses this for 30 seconds, they should think:
> "This person understands that accessibility work is a prioritization problem, not just a scanning problem."

**Test 2 — human-made feel:**
Show it to someone cold. They should think a small opinionated design studio built it for a university client — not that it was AI-scaffolded or template-cloned.

Specific checks:
- No AI visual tells: no purple gradients, no Inter/Space Grotesk, no rounded-everything, no badge overload
- Copy is terse and confident, not explanatory and cheerful
- One interaction feels genuinely satisfying — the result card entrance or confidence bar fill
- Typography has a point of view: IBM Plex Mono for labels/codes, Sora or DM Sans for body
- The triage principle bar looks designed, not dropped in
- Nothing in the UI says "Powered by AI" or explains that it uses machine learning
- Loading state: just a single line "Analyzing..." — no spinner, no encouraging messages