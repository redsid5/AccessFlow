import { FixOpportunity, PatternBucket } from './v2-types'

// ─── Effort ──────────────────────────────────────────────────────────────────

const EFFORT_BY_BUCKET: Record<PatternBucket, 'small' | 'medium' | 'large'> = {
  'buttons-links':  'small',
  'search':         'small',
  'media':          'small',
  'forms':          'medium',
  'navigation':     'medium',
  'layout-template':'medium',
  'document-pdf':   'large',
}

export function getEffort(fix: FixOpportunity): 'small' | 'medium' | 'large' {
  return EFFORT_BY_BUCKET[fix.patternBucket] ?? 'medium'
}

export const EFFORT_COPY: Record<'small' | 'medium' | 'large', string> = {
  small:  'quick fix',
  medium: 'half-day',
  large:  'multi-day',
}

// ─── Time saved ───────────────────────────────────────────────────────────────

const MINS_PER_AVOIDED_FIX: Record<PatternBucket, number> = {
  'buttons-links':  20,
  'search':         20,
  'media':          25,
  'forms':          35,
  'navigation':     40,
  'layout-template':30,
  'document-pdf':   60,
}

export function getTimeSaved(fix: FixOpportunity): string {
  const avoided = fix.rawIssueCount - 1
  if (avoided <= 0) return ''
  const mins = avoided * (MINS_PER_AVOIDED_FIX[fix.patternBucket] ?? 30)
  if (mins < 60) return `~${mins}m saved`
  const hours = mins / 60
  return `~${Number.isInteger(hours) ? hours : hours.toFixed(1)}h saved`
}

// ─── Leverage label ───────────────────────────────────────────────────────────

export function getLeverageLabel(fix: FixOpportunity): string {
  if (fix.scope.likelihood === 'global') return 'high leverage'
  if (fix.scope.likelihood === 'template') return 'shared component'
  if (fix.rawIssueCount >= 4) return 'repeated pattern'
  return ''
}

// ─── Next step ───────────────────────────────────────────────────────────────

export function getNextStep(fix: FixOpportunity): string {
  const scope = fix.scope.likelihood
  const n = fix.rawIssueCount
  const s = fix.affectedSourceCount

  switch (fix.patternBucket) {
    case 'navigation':
      if (scope === 'global') return `Fix the shared header navigation component once to clear ${n} repeated issues.`
      if (scope === 'template') return `Update the navigation template. The change will carry through to ${s} pages.`
      return `Fix the navigation issue on this page.`

    case 'forms':
      if (scope === 'template') return `Add labels to the form template. It removes the same gap from every form that uses it.`
      return `Add visible labels to every form field on ${s > 1 ? `these ${s} pages` : 'this page'}.`

    case 'buttons-links':
      if (scope === 'global') return `Add accessible names to icon-only controls in the shared component.`
      return `Add accessible names to unlabeled buttons and links on ${s > 1 ? `these ${s} pages` : 'this page'}.`

    case 'search':
      return `Change the search control to a semantic button element.`

    case 'media':
      return `Add alt text to ${n} image${n !== 1 ? 's' : ''}${s > 1 ? ` across ${s} pages` : ''}.`

    case 'document-pdf':
      if (n > 1) return `Remediate ${n} PDF documents — add document titles and fix reading order.`
      return `Fix the document title and reading order in this PDF.`

    case 'layout-template':
      if (scope === 'global' || scope === 'template') return `Fix the heading structure and focus styles in the shared template.`
      return `Fix heading hierarchy and focus visibility on this page.`

    default:
      return fix.actionLine
  }
}

// ─── Why this saves time ─────────────────────────────────────────────────────

export function getTimeSavedReason(fix: FixOpportunity): string {
  const { rawIssueCount: n, affectedSourceCount: s, scope } = fix

  if (scope.likelihood === 'global') {
    return `This is a shared component issue. Fix it once and it clears from every page that uses it — no repeated work.`
  }
  if (scope.likelihood === 'template') {
    return `The problem lives in a reused template. One update removes it from all ${s} page${s !== 1 ? 's' : ''} at once.`
  }
  if (n >= 3) {
    return `The same issue appears ${n} times. Fixing the root cause removes all of them together.`
  }
  return `Clears ${n} issue${n !== 1 ? 's' : ''} in a single change.`
}

// ─── Priority sort score ──────────────────────────────────────────────────────

export function getSortScore(fix: FixOpportunity): number {
  let score = 0
  if (fix.priority === 'high') score += 100
  else if (fix.priority === 'medium') score += 50
  if (fix.scope.likelihood === 'global') score += 40
  else if (fix.scope.likelihood === 'template') score += 20
  score += Math.min(fix.rawIssueCount * 3, 30)
  if (fix.decision === 'FIX') score += 10
  return score
}
