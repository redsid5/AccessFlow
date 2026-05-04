import { FixOpportunity, PatternBucket, ScopeLikelihood } from './v2-types'

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

// ─── Time saved ───────────────────────────────────────────────────────────────

// Each avoided individual fix costs roughly 30 min of developer time.
// Savings = issues consolidated away × 30 min.
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

// ─── Leverage ─────────────────────────────────────────────────────────────────

export function getLeverageLabel(fix: FixOpportunity): string {
  if (fix.scope.likelihood === 'global') return 'high leverage'
  if (fix.scope.likelihood === 'template') return 'shared fix'
  if (fix.rawIssueCount >= 4) return 'repeated pattern'
  return ''
}

// ─── Next step ───────────────────────────────────────────────────────────────

const NEXT_STEP_BY_BUCKET: Record<PatternBucket, string> = {
  'navigation':     'Update navigation component',
  'forms':          'Add labels to form fields',
  'buttons-links':  'Add accessible names to interactive elements',
  'search':         'Convert search control to a button element',
  'media':          'Add alt text to images',
  'document-pdf':   'Remediate PDF structure and metadata',
  'layout-template':'Fix heading hierarchy and focus styles',
}

export function getNextStep(fix: FixOpportunity): string {
  const bucket = NEXT_STEP_BY_BUCKET[fix.patternBucket]
  const scope = fix.scope.likelihood
  if (scope === 'global') return `${bucket} in shared site component`
  if (scope === 'template') return `${bucket} in reused template`
  return bucket
}

// ─── Why this saves time ─────────────────────────────────────────────────────

export function getTimeSavedReason(fix: FixOpportunity): string {
  const { rawIssueCount, affectedSourceCount, scope } = fix
  if (scope.likelihood === 'global') {
    return `One fix in a shared component clears ${rawIssueCount} issue${rawIssueCount !== 1 ? 's' : ''} across all pages that use it.`
  }
  if (scope.likelihood === 'template') {
    return `Fixing the template propagates the fix to all ${affectedSourceCount} page${affectedSourceCount !== 1 ? 's' : ''} automatically.`
  }
  if (rawIssueCount >= 3) {
    return `The same pattern appears ${rawIssueCount} times — one targeted fix removes all instances.`
  }
  return `Resolves ${rawIssueCount} issue${rawIssueCount !== 1 ? 's' : ''} in a single change.`
}

// ─── Priority order ───────────────────────────────────────────────────────────

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
