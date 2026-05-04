import { NormalizedIssue, Decision, Priority } from './v2-types'
import { IssueCluster } from './v2-cluster'

export interface ClusterDecision {
  decision: Decision
  priority: Priority
  rulePath: string[]
}

export function decideCluster(cluster: IssueCluster): ClusterDecision {
  const issues = cluster.issues
  const rulePath: string[] = []

  const maxLegalRisk = Math.max(...issues.map(i => i.signals.legalRisk))
  const maxStudentImpact = Math.max(...issues.map(i => i.signals.studentImpact))
  const maxTimeSensitivity = Math.max(...issues.map(i => i.signals.timeSensitivity))
  const avgExtractorConfidence =
    issues.reduce((sum, i) => sum + i.decisionSignals.extractorConfidence, 0) / issues.length

  const anyLowValue = issues.some(i => i.signals.lowValue)
  const avgReplaceability = issues.reduce((sum, i) => sum + i.signals.replaceability, 0) / issues.length
  const hasMissionCritical = issues.some(i => i.signals.missionCritical)

  let decision: Decision
  let priority: Priority

  // Rule 1
  if (maxLegalRisk >= 8) {
    decision = 'FIX'
    priority = 'high'
    rulePath.push(`Rule 1: legalRisk ${maxLegalRisk} ≥ 8 → FIX`)
  }
  // Rule 2
  else if (anyLowValue && avgReplaceability >= 7) {
    decision = 'DELETE'
    priority = 'low'
    rulePath.push(`Rule 2: lowValue=true and replaceability ${avgReplaceability.toFixed(1)} ≥ 7 → DELETE`)
  }
  // Rule 3
  else if (avgExtractorConfidence < 0.6) {
    decision = 'REVIEW'
    priority = 'medium'
    rulePath.push(`Rule 3: extractorConfidence ${avgExtractorConfidence.toFixed(2)} < 0.6 → REVIEW`)
  }
  // Rule 4
  else if (cluster.scopeConfidence < 0.6) {
    decision = 'REVIEW'
    priority = 'medium'
    rulePath.push(`Rule 4: scopeConfidence ${cluster.scopeConfidence.toFixed(2)} < 0.6 → REVIEW (ambiguous scope)`)
  }
  // Rule 4b
  else if (hasMissionCritical || issues.length >= 3) {
    decision = 'FIX'
    priority = maxStudentImpact >= 8 || maxTimeSensitivity >= 8 ? 'high' : 'medium'
    rulePath.push(`Rule 4b: ${hasMissionCritical ? 'missionCritical' : `${issues.length} repeated issues`} → FIX`)
  }
  // Rule 4c
  else if (anyLowValue) {
    decision = 'DELETE'
    priority = 'low'
    rulePath.push(`Rule 4c: lowValue content → DELETE`)
  }
  // Default
  else {
    decision = 'FIX'
    priority = 'medium'
    rulePath.push(`Default: no clear exception → FIX`)
  }

  // Priority escalation
  if (decision === 'FIX' && priority !== 'high') {
    if (maxLegalRisk >= 8 || maxStudentImpact >= 8 || maxTimeSensitivity >= 8) {
      priority = 'high'
      rulePath.push(`Priority elevated to high: legalRisk=${maxLegalRisk} studentImpact=${maxStudentImpact}`)
    }
  }

  return { decision, priority, rulePath }
}

export function pickOwner(cluster: IssueCluster): { team: string; role: string } {
  const bucket = cluster.patternBucket
  const scope = cluster.dominantScope

  if (bucket === 'document-pdf') return { team: 'Document owner', role: 'Content editor' }
  if (bucket === 'forms' && scope === 'template') return { team: 'Web team', role: 'Frontend developer' }
  if (bucket === 'forms') return { team: 'Department content owner', role: 'Form owner' }
  if (bucket === 'navigation' || bucket === 'search') return { team: 'Web team', role: 'Frontend developer' }
  if (bucket === 'media') return { team: 'Content team', role: 'Content editor' }
  if (scope === 'global' || scope === 'template') return { team: 'Web team', role: 'Frontend developer' }
  return { team: 'Accessibility office', role: 'Accessibility specialist' }
}

export function buildFixLocation(cluster: IssueCluster): string {
  const scope = cluster.dominantScope
  const bucket = cluster.patternBucket
  const key = cluster.canonicalKey

  if (scope === 'global') {
    if (bucket === 'navigation') return 'Shared header navigation component'
    if (bucket === 'search') return 'Global search component'
    if (bucket === 'buttons-links') return 'Shared button/link stylesheet'
    if (bucket === 'layout-template') return 'Global page template'
    return 'Shared site component'
  }
  if (scope === 'template') {
    if (bucket === 'forms') return 'Form template'
    if (bucket === 'layout-template') return 'Page template'
    if (bucket === 'document-pdf') return 'Document template'
    return 'Section template'
  }
  if (key.includes('pdf')) return 'Individual PDF document'
  return 'Page-specific content'
}

export function buildActionLine(
  cluster: IssueCluster,
  fixLocation: string,
  rawIssueCount: number,
  affectedSourceCount: number
): string {
  const bucket = cluster.patternBucket
  const key = cluster.canonicalKey

  const what = describeWhat(bucket, key)
  return `Fix ${fixLocation.toLowerCase()} ${what} once to resolve ${rawIssueCount} repeated issue${rawIssueCount !== 1 ? 's' : ''} across ${affectedSourceCount} source${affectedSourceCount !== 1 ? 's' : ''}.`
}

function describeWhat(bucket: NormalizedIssue['patternBucket'], key: string): string {
  const map: Record<string, string> = {
    'nav-keyboard-trap':            'keyboard navigation behavior',
    'missing-skip-link':            'skip navigation link',
    'unlabeled-form-input':         'form field labeling',
    'icon-link-no-accessible-name': 'icon link accessible names',
    'search-control-not-button':    'search control markup',
    'missing-alt-text-pattern':     'image alt text',
    'pdf-missing-document-title':   'document title metadata',
    'pdf-untagged-content':         'document tag structure',
    'missing-heading-structure':    'heading hierarchy',
    'low-color-contrast':           'color contrast',
    'auto-playing-media':           'media autoplay behavior',
    'missing-captions':             'media captions',
    'table-no-header-markup':       'table header markup',
    'button-empty-label':           'button accessible labels',
    'focus-not-visible':            'focus visibility',
    'landmark-regions-missing':     'landmark region structure',
  }
  return map[key] || `${bucket} accessibility issue`
}

export function buildVerificationChecklist(bucket: NormalizedIssue['patternBucket']): string[] {
  const checklists: Record<NormalizedIssue['patternBucket'], string[]> = {
    navigation: [
      'Tab through all top-level navigation items.',
      'Confirm submenu items receive focus in logical order.',
      'Verify Escape closes open menus.',
      'Verify visible focus state on all items.',
      'Test with screen reader and keyboard only.',
    ],
    forms: [
      'Confirm every input has a visible or programmatic label.',
      'Test screen reader announcement of field name.',
      'Submit form with keyboard only.',
      'Verify inline validation is announced accessibly.',
      'Check error messages are associated with their field.',
    ],
    'buttons-links': [
      'Verify all buttons and links have descriptive accessible names.',
      'Confirm icon-only controls have aria-label or visually-hidden text.',
      'Test tab order is logical through all interactive elements.',
      'Verify activated state is announced by screen reader.',
    ],
    search: [
      'Confirm search trigger is a semantic button element.',
      'Verify Enter and Space activate the search control.',
      'Verify control has an accessible name.',
      'Test search results region is announced on update.',
    ],
    media: [
      'Confirm informative images have descriptive alt text.',
      'Confirm decorative images use empty alt attribute.',
      'Verify linked images expose accessible names.',
      'Check captions are available for all video content.',
    ],
    'document-pdf': [
      'Open document in PDF viewer and verify reading order.',
      'Confirm document title is set in document properties.',
      'Check all images in PDF have alt text.',
      'Verify form fields in PDF have labels if applicable.',
    ],
    'layout-template': [
      'Verify heading hierarchy is logical (H1 → H2 → H3).',
      'Check color contrast ratio meets 4.5:1 for normal text.',
      'Confirm focus indicator is visible on all interactive elements.',
      'Test landmark regions are present (main, nav, header, footer).',
    ],
  }
  return checklists[bucket] || [
    'Verify the fix resolves the identified issue.',
    'Test with keyboard only.',
    'Test with screen reader.',
  ]
}
