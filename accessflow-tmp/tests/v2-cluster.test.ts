import { describe, it, expect } from 'vitest'
import { clusterIssues } from '@/lib/v2-cluster'
import { generateFixOpportunities } from '@/lib/v2-fix'
import { NormalizedIssue } from '@/lib/v2-types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _id = 0
function makeIssue(
  canonicalKey: string,
  sourceId: string,
  scopeOverrides: Partial<NormalizedIssue['scopeInference']> = {},
  signalOverrides: Partial<NormalizedIssue['signals']> = {},
): NormalizedIssue {
  return {
    id: `issue-${++_id}`,
    sourceType: 'url',
    sourceId,
    sourceTitle: `Page on ${sourceId}`,
    pageUrl: `https://${sourceId}/page`,
    canonicalKey,
    severity: 'medium',
    issueTitle: canonicalKey,
    issueSummary: `${canonicalKey} detected`,
    evidence: [],
    patternBucket: 'navigation',
    signals: {
      publicFacing: true,
      missionCritical: false,
      timeSensitive: false,
      lowValue: false,
      betterAsHtml: false,
      legalRisk: 4,
      studentImpact: 4,
      usageFrequency: 5,
      replaceability: 3,
      timeSensitivity: 3,
      ...signalOverrides,
    },
    scopeInference: {
      likelihood: 'local',
      confidence: 0.7,
      reasons: [],
      ...scopeOverrides,
    },
    decisionSignals: { extractorConfidence: 0.85, contradictions: [] },
  }
}

// ─── Clustering by canonicalKey ───────────────────────────────────────────────

describe('clusterIssues — grouping', () => {
  it('groups issues with the same canonicalKey into one cluster', () => {
    const issues = [
      makeIssue('missing-skip-link', 'src-a'),
      makeIssue('missing-skip-link', 'src-b'),
      makeIssue('missing-skip-link', 'src-c'),
    ]
    const clusters = clusterIssues(issues)
    expect(clusters).toHaveLength(1)
    expect(clusters[0].issues).toHaveLength(3)
  })

  it('creates separate clusters for different canonicalKeys', () => {
    const issues = [
      makeIssue('missing-skip-link', 'src-a'),
      makeIssue('nav-keyboard-trap', 'src-a'),
      makeIssue('unlabeled-form-input', 'src-b'),
    ]
    const clusters = clusterIssues(issues)
    expect(clusters).toHaveLength(3)
  })

  it('returns clusters sorted by issue count descending', () => {
    const issues = [
      makeIssue('missing-skip-link', 'src-a'),
      makeIssue('nav-keyboard-trap', 'src-a'),
      makeIssue('nav-keyboard-trap', 'src-b'),
      makeIssue('nav-keyboard-trap', 'src-c'),
    ]
    const clusters = clusterIssues(issues)
    expect(clusters[0].canonicalKey).toBe('nav-keyboard-trap')
    expect(clusters[0].issues).toHaveLength(3)
  })
})

// ─── Compression ratio (core product metric) ─────────────────────────────────

describe('Compression ratio', () => {
  it('N issues with same key → 1 fix → compressionRatio = N', () => {
    const issues = [
      makeIssue('missing-skip-link', 'src-a'),
      makeIssue('missing-skip-link', 'src-b'),
      makeIssue('missing-skip-link', 'src-c'),
      makeIssue('missing-skip-link', 'src-d'),
    ]
    const clusters = clusterIssues(issues)
    const fixes = generateFixOpportunities(clusters)
    expect(fixes).toHaveLength(1)
    expect(fixes[0].compressionRatio).toBe(4)
    expect(fixes[0].consolidatedFixCount).toBe(1)
    expect(fixes[0].rawIssueCount).toBe(4)
  })

  it('multiple patterns each compress independently', () => {
    const issues = [
      makeIssue('missing-skip-link', 'src-a'),
      makeIssue('missing-skip-link', 'src-b'),
      makeIssue('missing-skip-link', 'src-c'),
      makeIssue('nav-keyboard-trap', 'src-a'),
      makeIssue('nav-keyboard-trap', 'src-b'),
    ]
    const clusters = clusterIssues(issues)
    const fixes = generateFixOpportunities(clusters)
    expect(fixes).toHaveLength(2)

    const skipFix = fixes.find(f => f.canonicalKey === 'missing-skip-link')!
    const trapFix = fixes.find(f => f.canonicalKey === 'nav-keyboard-trap')!
    expect(skipFix.compressionRatio).toBe(3)
    expect(trapFix.compressionRatio).toBe(2)
  })

  it('single issue still produces compressionRatio = 1', () => {
    const issues = [makeIssue('button-empty-label', 'src-a')]
    const clusters = clusterIssues(issues)
    const fixes = generateFixOpportunities(clusters)
    expect(fixes[0].compressionRatio).toBe(1)
  })

  it('overall compression = total raw issues / total fixes', () => {
    // 12 raw issues → 3 patterns → 3 fixes → 4:1 system ratio
    const issues = [
      ...Array(4).fill(null).map(() => makeIssue('missing-skip-link', 'src-a')),
      ...Array(4).fill(null).map(() => makeIssue('nav-keyboard-trap', 'src-b')),
      ...Array(4).fill(null).map(() => makeIssue('unlabeled-form-input', 'src-c')),
    ]
    const clusters = clusterIssues(issues)
    const fixes = generateFixOpportunities(clusters)
    const totalRaw = fixes.reduce((s, f) => s + f.rawIssueCount, 0)
    const ratio = totalRaw / fixes.length
    expect(ratio).toBe(4)
  })
})

// ─── Scope resolution ─────────────────────────────────────────────────────────

describe('clusterIssues — scope resolution', () => {
  it('marks cluster global when pattern appears in ≥ 4 distinct sources', () => {
    const issues = [
      makeIssue('missing-skip-link', 'src-a'),
      makeIssue('missing-skip-link', 'src-b'),
      makeIssue('missing-skip-link', 'src-c'),
      makeIssue('missing-skip-link', 'src-d'),
    ]
    const [cluster] = clusterIssues(issues)
    expect(cluster.dominantScope).toBe('global')
    expect(cluster.scopeConfidence).toBeGreaterThan(0.7)
  })

  it('marks cluster template when pattern appears in 2-3 sources with majority template votes', () => {
    const issues = [
      makeIssue('missing-skip-link', 'src-a', { likelihood: 'template', confidence: 0.8 }),
      makeIssue('missing-skip-link', 'src-b', { likelihood: 'template', confidence: 0.75 }),
    ]
    const [cluster] = clusterIssues(issues)
    expect(cluster.dominantScope).toBe('template')
  })

  it('marks cluster global when majority of multi-source issues are global', () => {
    const issues = [
      makeIssue('missing-skip-link', 'src-a', { likelihood: 'global', confidence: 0.9 }),
      makeIssue('missing-skip-link', 'src-b', { likelihood: 'global', confidence: 0.85 }),
      makeIssue('missing-skip-link', 'src-c', { likelihood: 'template', confidence: 0.7 }),
    ]
    const [cluster] = clusterIssues(issues)
    expect(cluster.dominantScope).toBe('global')
  })

  it('uses highest-confidence scope for single-source clusters', () => {
    const issues = [
      makeIssue('missing-skip-link', 'src-a', { likelihood: 'local', confidence: 0.6 }),
      makeIssue('missing-skip-link', 'src-a', { likelihood: 'global', confidence: 0.9 }),
    ]
    const [cluster] = clusterIssues(issues)
    expect(cluster.dominantScope).toBe('global')
    expect(cluster.scopeConfidence).toBeCloseTo(0.9)
  })
})

// ─── Affected sources deduplication ──────────────────────────────────────────

describe('generateFixOpportunities — source deduplication', () => {
  it('deduplicates sources from the same sourceId', () => {
    // same page scanned twice → still counts as 1 source
    const issues = [
      makeIssue('missing-skip-link', 'src-a'),
      makeIssue('missing-skip-link', 'src-a'),
      makeIssue('missing-skip-link', 'src-b'),
    ]
    const clusters = clusterIssues(issues)
    const [fix] = generateFixOpportunities(clusters)
    expect(fix.rawIssueCount).toBe(3)
    expect(fix.affectedSourceCount).toBe(2)
    expect(fix.affectedSources).toHaveLength(2)
  })
})

// ─── FixOpportunity field completeness ───────────────────────────────────────

describe('generateFixOpportunities — output shape', () => {
  it('every fix has a non-empty actionLine', () => {
    const issues = [makeIssue('missing-skip-link', 'src-a'), makeIssue('missing-skip-link', 'src-b')]
    const fixes = generateFixOpportunities(clusterIssues(issues))
    expect(fixes[0].actionLine).toBeTruthy()
    expect(fixes[0].actionLine.length).toBeGreaterThan(20)
  })

  it('every fix has a verificationChecklist with at least 3 items', () => {
    const issues = [makeIssue('missing-skip-link', 'src-a')]
    const fixes = generateFixOpportunities(clusterIssues(issues))
    expect(fixes[0].verificationChecklist.length).toBeGreaterThanOrEqual(3)
  })

  it('every fix has a decision and priority', () => {
    const issues = [makeIssue('missing-skip-link', 'src-a')]
    const fixes = generateFixOpportunities(clusterIssues(issues))
    expect(['FIX', 'DELETE', 'REVIEW']).toContain(fixes[0].decision)
    expect(['high', 'medium', 'low']).toContain(fixes[0].priority)
  })

  it('consolidatedFixCount is always 1', () => {
    const issues = Array(6).fill(null).map(() => makeIssue('missing-skip-link', 'src-a'))
    const fixes = generateFixOpportunities(clusterIssues(issues))
    expect(fixes[0].consolidatedFixCount).toBe(1)
  })

  it('decisionTrace.rulePath is non-empty', () => {
    const issues = [makeIssue('missing-skip-link', 'src-a')]
    const fixes = generateFixOpportunities(clusterIssues(issues))
    expect(fixes[0].decisionTrace.rulePath.length).toBeGreaterThan(0)
  })

  it('status defaults to NEW', () => {
    const issues = [makeIssue('missing-skip-link', 'src-a')]
    const fixes = generateFixOpportunities(clusterIssues(issues))
    expect(fixes[0].status).toBe('NEW')
  })
})
