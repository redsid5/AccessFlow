import { describe, it, expect } from 'vitest'
import { decideCluster } from '@/lib/v2-decision'
import { IssueCluster } from '@/lib/v2-cluster'
import { NormalizedIssue } from '@/lib/v2-types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeIssue(overrides: Partial<NormalizedIssue['signals'] & {
  extractorConfidence?: number
  scopeConfidence?: number
}> = {}): NormalizedIssue {
  return {
    id: `issue-${Math.random()}`,
    sourceType: 'url',
    sourceId: 'src-1',
    sourceTitle: 'Test page',
    canonicalKey: 'low-color-contrast',
    severity: 'medium',
    issueTitle: 'Low color contrast',
    issueSummary: 'Text contrast ratio is below 4.5:1',
    evidence: [],
    patternBucket: 'layout-template',
    signals: {
      publicFacing: true,
      missionCritical: overrides.missionCritical ?? false,
      timeSensitive: overrides.timeSensitive ?? false,
      lowValue: overrides.lowValue ?? false,
      betterAsHtml: false,
      legalRisk: overrides.legalRisk ?? 4,
      studentImpact: overrides.studentImpact ?? 4,
      usageFrequency: 5,
      replaceability: overrides.replaceability ?? 3,
      timeSensitivity: overrides.timeSensitivity ?? 3,
    },
    scopeInference: {
      likelihood: 'local',
      confidence: overrides.scopeConfidence ?? 0.75,
      reasons: [],
    },
    decisionSignals: {
      extractorConfidence: overrides.extractorConfidence ?? 0.8,
      contradictions: [],
    },
  }
}

function makeCluster(issues: NormalizedIssue[], scopeConfidence = 0.8): IssueCluster {
  return {
    clusterKey: 'layout-template::low-color-contrast',
    canonicalKey: 'low-color-contrast',
    patternBucket: 'layout-template',
    issues,
    dominantScope: 'local',
    scopeConfidence,
    scopeReasons: [],
  }
}

// ─── Rule 1: legalRisk ≥ 8 → FIX / high ─────────────────────────────────────

describe('Rule 1 — high legal risk', () => {
  it('returns FIX when any issue has legalRisk ≥ 8', () => {
    const cluster = makeCluster([makeIssue({ legalRisk: 8 })])
    const { decision, priority } = decideCluster(cluster)
    expect(decision).toBe('FIX')
    expect(priority).toBe('high')
  })

  it('records the rule path entry', () => {
    const cluster = makeCluster([makeIssue({ legalRisk: 9 })])
    const { rulePath } = decideCluster(cluster)
    expect(rulePath[0]).toMatch(/Rule 1/)
    expect(rulePath[0]).toMatch(/legalRisk/)
  })

  it('uses max legalRisk across issues — one high-risk issue triggers FIX', () => {
    const cluster = makeCluster([
      makeIssue({ legalRisk: 2 }),
      makeIssue({ legalRisk: 10 }),
      makeIssue({ legalRisk: 3 }),
    ])
    const { decision } = decideCluster(cluster)
    expect(decision).toBe('FIX')
  })

  it('does NOT trigger Rule 1 when legalRisk = 7', () => {
    const cluster = makeCluster([makeIssue({ legalRisk: 7 })])
    const { rulePath } = decideCluster(cluster)
    expect(rulePath[0]).not.toMatch(/Rule 1/)
  })
})

// ─── Rule 2: lowValue + replaceability ≥ 7 → DELETE / low ───────────────────

describe('Rule 2 — low-value deletable content', () => {
  it('returns DELETE when lowValue=true and avg replaceability ≥ 7', () => {
    const cluster = makeCluster([
      makeIssue({ lowValue: true, replaceability: 8 }),
      makeIssue({ lowValue: true, replaceability: 7 }),
    ])
    const { decision, priority } = decideCluster(cluster)
    expect(decision).toBe('DELETE')
    expect(priority).toBe('low')
  })

  it('Rule 2 fires early via replaceability threshold — Rule 4c is the lowValue fallback', () => {
    // replaceability < 7: Rule 2 does not fire, but Rule 4c still catches lowValue content
    const cluster = makeCluster([makeIssue({ lowValue: true, replaceability: 5 })])
    const { decision, rulePath } = decideCluster(cluster)
    // Still DELETE (via Rule 4c), but Rule 2 did NOT fire
    expect(decision).toBe('DELETE')
    expect(rulePath[0]).not.toMatch(/Rule 2/)
    expect(rulePath.some(r => r.includes('4c') || r.includes('lowValue'))).toBe(true)
  })

  it('does NOT delete when lowValue=false even if replaceability is high', () => {
    const cluster = makeCluster([makeIssue({ lowValue: false, replaceability: 9 })])
    const { decision } = decideCluster(cluster)
    expect(decision).not.toBe('DELETE')
  })
})

// ─── Rule 3: extractorConfidence < 0.6 → REVIEW ──────────────────────────────

describe('Rule 3 — low extractor confidence', () => {
  it('returns REVIEW when avg extractorConfidence < 0.6', () => {
    const cluster = makeCluster([
      makeIssue({ extractorConfidence: 0.4 }),
      makeIssue({ extractorConfidence: 0.5 }),
    ])
    const { decision, priority } = decideCluster(cluster)
    expect(decision).toBe('REVIEW')
    expect(priority).toBe('medium')
  })

  it('does NOT trigger Rule 3 when confidence = 0.6 exactly', () => {
    const cluster = makeCluster([makeIssue({ extractorConfidence: 0.6 })])
    const { rulePath } = decideCluster(cluster)
    expect(rulePath[0]).not.toMatch(/Rule 3/)
  })

  it('averages confidence across all issues in cluster', () => {
    // avg = (0.5 + 0.9) / 2 = 0.7 → should NOT trigger Rule 3
    const cluster = makeCluster([
      makeIssue({ extractorConfidence: 0.5 }),
      makeIssue({ extractorConfidence: 0.9 }),
    ])
    const { rulePath } = decideCluster(cluster)
    expect(rulePath[0]).not.toMatch(/Rule 3/)
  })
})

// ─── Rule 4: scopeConfidence < 0.6 → REVIEW ──────────────────────────────────

describe('Rule 4 — ambiguous scope', () => {
  it('returns REVIEW when scopeConfidence < 0.6', () => {
    const cluster = makeCluster([makeIssue()], 0.4)
    const { decision } = decideCluster(cluster)
    expect(decision).toBe('REVIEW')
  })

  it('records the ambiguous scope reason in rulePath', () => {
    const cluster = makeCluster([makeIssue()], 0.55)
    const { rulePath } = decideCluster(cluster)
    expect(rulePath[0]).toMatch(/Rule 4/)
    expect(rulePath[0]).toMatch(/scope/)
  })
})

// ─── Rule 4b: missionCritical or 3+ issues → FIX ─────────────────────────────

describe('Rule 4b — mission critical or repeated issues', () => {
  it('returns FIX for missionCritical content', () => {
    const cluster = makeCluster([makeIssue({ missionCritical: true })])
    const { decision } = decideCluster(cluster)
    expect(decision).toBe('FIX')
  })

  it('returns FIX when cluster has 3 or more issues', () => {
    const cluster = makeCluster([makeIssue(), makeIssue(), makeIssue()])
    const { decision } = decideCluster(cluster)
    expect(decision).toBe('FIX')
  })

  it('escalates priority to high when studentImpact ≥ 8', () => {
    const cluster = makeCluster([makeIssue({ missionCritical: true, studentImpact: 9 })])
    const { priority } = decideCluster(cluster)
    expect(priority).toBe('high')
  })

  it('escalates priority to high when timeSensitivity ≥ 8', () => {
    const cluster = makeCluster([makeIssue({ missionCritical: true, timeSensitivity: 8 })])
    const { priority } = decideCluster(cluster)
    expect(priority).toBe('high')
  })

  it('stays medium when missionCritical but no urgency signals', () => {
    const cluster = makeCluster([makeIssue({ missionCritical: true, studentImpact: 4, timeSensitivity: 3 })])
    const { priority } = decideCluster(cluster)
    expect(priority).toBe('medium')
  })
})

// ─── Rule 4c: lowValue fallback → DELETE ─────────────────────────────────────

describe('Rule 4c — low value fallback', () => {
  it('returns DELETE for lowValue content that is not highly replaceable', () => {
    // replaceability < 7 so Rule 2 doesn't fire, but lowValue is true
    const cluster = makeCluster([makeIssue({ lowValue: true, replaceability: 4 })])
    const { decision, priority } = decideCluster(cluster)
    expect(decision).toBe('DELETE')
    expect(priority).toBe('low')
  })
})

// ─── Default rule ─────────────────────────────────────────────────────────────

describe('Default rule — FIX with medium priority', () => {
  it('returns FIX/medium when no exception applies', () => {
    const cluster = makeCluster([makeIssue()])
    const { decision, priority } = decideCluster(cluster)
    expect(decision).toBe('FIX')
    expect(priority).toBe('medium')
  })
})

// ─── Priority escalation ──────────────────────────────────────────────────────

describe('Priority escalation', () => {
  it('escalates FIX to high when legalRisk ≥ 8 (already handled by Rule 1)', () => {
    const cluster = makeCluster([makeIssue({ legalRisk: 8 })])
    const { decision, priority } = decideCluster(cluster)
    expect(decision).toBe('FIX')
    expect(priority).toBe('high')
  })

  it('does not escalate DELETE decisions', () => {
    const cluster = makeCluster([makeIssue({ lowValue: true, replaceability: 9 })])
    const { decision, priority } = decideCluster(cluster)
    expect(decision).toBe('DELETE')
    expect(priority).toBe('low')
  })

  it('is deterministic — same input always produces same output', () => {
    const issues = [makeIssue({ legalRisk: 6, studentImpact: 7 }), makeIssue({ legalRisk: 5 })]
    const cluster = makeCluster(issues)
    const result1 = decideCluster({ ...cluster })
    const result2 = decideCluster({ ...cluster })
    expect(result1.decision).toBe(result2.decision)
    expect(result1.priority).toBe(result2.priority)
    expect(result1.rulePath).toEqual(result2.rulePath)
  })
})

// ─── Rule ordering — higher rules shadow lower ────────────────────────────────

describe('Rule ordering', () => {
  it('Rule 1 wins over Rule 2 when both conditions are met', () => {
    // legalRisk ≥ 8 AND lowValue + replaceability ≥ 7
    const cluster = makeCluster([makeIssue({ legalRisk: 8, lowValue: true, replaceability: 9 })])
    const { decision, rulePath } = decideCluster(cluster)
    expect(decision).toBe('FIX')
    expect(rulePath[0]).toMatch(/Rule 1/)
  })
})
