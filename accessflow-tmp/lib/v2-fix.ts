import { FixOpportunity, QueueStatus } from './v2-types'
import { IssueCluster } from './v2-cluster'
import {
  decideCluster, pickOwner, buildFixLocation,
  buildActionLine, buildVerificationChecklist,
} from './v2-decision'

export function generateFixOpportunities(clusters: IssueCluster[]): FixOpportunity[] {
  return clusters.map(cluster => generateOne(cluster))
}

function generateOne(cluster: IssueCluster): FixOpportunity {
  const { decision, priority, rulePath } = decideCluster(cluster)
  const owner = pickOwner(cluster)
  const fixLocation = buildFixLocation(cluster)

  const affectedSources = deduplicateSources(cluster)
  const rawIssueCount = cluster.issues.length
  const affectedSourceCount = affectedSources.length

  const actionLine = buildActionLine(cluster, fixLocation, rawIssueCount, affectedSourceCount)
  const verificationChecklist = buildVerificationChecklist(cluster.patternBucket)

  const groupedBecause = buildGroupedBecause(cluster)

  return {
    id: `fix-${cluster.clusterKey}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    patternBucket: cluster.patternBucket,
    canonicalKey: cluster.canonicalKey,
    title: buildTitle(cluster),
    summary: buildSummary(cluster, rawIssueCount, affectedSourceCount),

    scope: {
      likelihood: cluster.dominantScope,
      confidence: cluster.scopeConfidence,
    },

    decision,
    priority,
    owner,
    fixLocation,
    actionLine,
    verificationChecklist,

    rawIssueIds: cluster.issues.map(i => i.id),
    affectedSources,
    rawIssueCount,
    affectedSourceCount,
    consolidatedFixCount: 1,
    compressionRatio: rawIssueCount,

    decisionTrace: {
      rulePath,
      groupedBecause,
      scopeReasons: cluster.scopeReasons,
      timestamp: new Date().toISOString(),
    },

    status: 'NEW' as QueueStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function buildTitle(cluster: IssueCluster): string {
  const keyMap: Record<string, string> = {
    'nav-keyboard-trap':            'Navigation keyboard trap',
    'missing-skip-link':            'Missing skip navigation link',
    'unlabeled-form-input':         'Unlabeled form inputs',
    'icon-link-no-accessible-name': 'Icon links without accessible names',
    'search-control-not-button':    'Search control not a button',
    'missing-alt-text-pattern':     'Images missing alt text',
    'pdf-missing-document-title':   'PDF missing document title',
    'pdf-untagged-content':         'Untagged PDF content',
    'missing-heading-structure':    'Missing heading structure',
    'low-color-contrast':           'Low color contrast',
    'auto-playing-media':           'Auto-playing media',
    'missing-captions':             'Media missing captions',
    'table-no-header-markup':       'Tables missing header markup',
    'button-empty-label':           'Buttons with empty labels',
    'focus-not-visible':            'Focus indicator not visible',
    'landmark-regions-missing':     'Landmark regions missing',
  }
  return keyMap[cluster.canonicalKey] || cluster.canonicalKey.replace(/-/g, ' ')
}

function buildSummary(cluster: IssueCluster, rawIssueCount: number, sourceCount: number): string {
  const scopeLabel = cluster.dominantScope === 'global'
    ? 'a shared site component'
    : cluster.dominantScope === 'template'
      ? 'a reused template'
      : 'page-specific content'
  return `${rawIssueCount} instance${rawIssueCount !== 1 ? 's' : ''} of this pattern detected across ${sourceCount} source${sourceCount !== 1 ? 's' : ''}, originating from ${scopeLabel}.`
}

function buildGroupedBecause(cluster: IssueCluster): string[] {
  const reasons: string[] = [
    `All issues share canonical pattern key: ${cluster.canonicalKey}`,
    `All map to pattern bucket: ${cluster.patternBucket}`,
  ]
  const sources = new Set(cluster.issues.map(i => i.sourceId))
  if (sources.size > 1) {
    reasons.push(`Pattern repeats across ${sources.size} distinct sources`)
  }
  return reasons
}

function deduplicateSources(cluster: IssueCluster): FixOpportunity['affectedSources'] {
  const seen = new Map<string, FixOpportunity['affectedSources'][number]>()
  for (const issue of cluster.issues) {
    if (!seen.has(issue.sourceId)) {
      seen.set(issue.sourceId, {
        sourceId: issue.sourceId,
        sourceTitle: issue.sourceTitle,
        pageUrl: issue.pageUrl,
      })
    }
  }
  return Array.from(seen.values())
}
