import { NormalizedIssue, ScopeLikelihood } from './v2-types'

const GLOBAL_SIGNALS = [
  'header', 'footer', 'nav', 'navigation', 'primary nav', 'main menu',
  'site-wide', 'sitewide', 'global', 'shared', 'universal search',
  'skip link', 'landmark',
]

const TEMPLATE_SIGNALS = [
  'template', 'cms', 'content area', 'article', 'landing page',
  'block', 'widget', 'section template', 'form template', 'page type',
]

const LOCAL_SIGNALS = [
  'this page', 'this document', 'one-off', 'specific', 'unique to',
  'only on', 'particular',
]

export function inferScope(issue: NormalizedIssue, allIssues: NormalizedIssue[]): NormalizedIssue['scopeInference'] {
  const evidenceText = issue.evidence.join(' ').toLowerCase()
  const titleLower = issue.issueTitle.toLowerCase()
  const combined = `${evidenceText} ${titleLower} ${issue.issueSummary.toLowerCase()}`

  const reasons: string[] = []
  let score = 0

  const globalHits = GLOBAL_SIGNALS.filter(s => combined.includes(s))
  if (globalHits.length > 0) {
    score += globalHits.length * 20
    reasons.push(`Evidence references shared component: ${globalHits.slice(0, 2).join(', ')}`)
  }

  const sameKeyAcrossSources = allIssues.filter(
    i => i.id !== issue.id && i.canonicalKey === issue.canonicalKey && i.sourceId !== issue.sourceId
  ).length
  if (sameKeyAcrossSources >= 3) {
    score += 40
    reasons.push(`Same pattern found across ${sameKeyAcrossSources} other sources`)
  } else if (sameKeyAcrossSources >= 1) {
    score += 20
    reasons.push(`Same pattern found in ${sameKeyAcrossSources} other source(s)`)
  }

  const templateHits = TEMPLATE_SIGNALS.filter(s => combined.includes(s))
  const localHits = LOCAL_SIGNALS.filter(s => combined.includes(s))

  let likelihood: ScopeLikelihood
  let confidence: number

  if (score >= 60 && globalHits.length > 0 && localHits.length === 0) {
    likelihood = 'global'
    confidence = Math.min(0.95, 0.6 + score / 200)
    reasons.push('Pattern appears in shared site infrastructure')
  } else if (score >= 30 || templateHits.length > 0) {
    likelihood = 'template'
    confidence = Math.min(0.85, 0.55 + score / 200)
    if (templateHits.length > 0) reasons.push(`Evidence references template pattern: ${templateHits[0]}`)
  } else {
    likelihood = 'local'
    confidence = localHits.length > 0 ? 0.8 : 0.6
    if (localHits.length === 0 && sameKeyAcrossSources === 0) {
      reasons.push('Single source, no cross-page evidence found')
    }
  }

  // If LLM already inferred a higher-confidence scope, trust it if confidence > 0.8
  const llmScope = issue.scopeInference
  if (llmScope.confidence > 0.8 && llmScope.likelihood !== likelihood) {
    if (llmScope.likelihood === 'global' && score >= 20) {
      return {
        likelihood: 'global',
        confidence: Math.max(llmScope.confidence, confidence),
        reasons: [...reasons, ...llmScope.reasons.slice(0, 1)],
      }
    }
  }

  return { likelihood, confidence, reasons }
}

export function contradictsScope(issue: NormalizedIssue): string[] {
  const contradictions: string[] = []
  const { likelihood, confidence } = issue.scopeInference

  if (likelihood === 'global' && confidence < 0.6) {
    contradictions.push('Scope claimed global but confidence is low — verify cross-page pattern')
  }
  if (likelihood === 'global' && issue.signals.lowValue) {
    contradictions.push('Global scope claimed on low-value content — unlikely to be sitewide')
  }
  if (issue.signals.missionCritical && likelihood === 'local' && confidence < 0.7) {
    contradictions.push('Mission-critical issue marked local — confirm it is not in a shared template')
  }
  return contradictions
}
