import type { PriorityScore, TriageResult } from './types'

// studentImpact, legalRisk, timeSensitivity weighted ×2 — direct harm and deadline risk matter most
export const SCORING_WEIGHTS = {
  studentImpact: 2,
  legalRisk: 2,
  usageFrequency: 1,
  contentReplaceability: 1,
  timeSensitivity: 2,
} as const

const WEIGHT_SUM = Object.values(SCORING_WEIGHTS).reduce((a, b) => a + b, 0)
const SUBSCORE_MAX = 10

// LLM provides the 5 subscores; we compute the total so it's never hallucinated
export function computePriorityTotal(scores: Omit<PriorityScore, 'total'>): number {
  const raw =
    scores.studentImpact * SCORING_WEIGHTS.studentImpact +
    scores.legalRisk * SCORING_WEIGHTS.legalRisk +
    scores.usageFrequency * SCORING_WEIGHTS.usageFrequency +
    scores.contentReplaceability * SCORING_WEIGHTS.contentReplaceability +
    scores.timeSensitivity * SCORING_WEIGHTS.timeSensitivity

  return Math.round((raw / (WEIGHT_SUM * SUBSCORE_MAX)) * 100)
}

export const PRIORITY_THRESHOLDS = { high: 70, medium: 40 } as const

export interface DecisionTrace {
  timestamp: string
  actor: 'accessflow-pipeline'
  rule: string
  activeSignals: string[]
  scoreBreakdown: { dimension: string; score: number; weight: number; weighted: number }[]
  rawTotal: number
  normalizedScore: number
  priorityBand: string
  confidenceGated: boolean
}

export function buildDecisionTrace(result: TriageResult, timestamp?: string): DecisionTrace {
  const { signals, priorityScore, decision, confidence } = result

  const activeSignals = (Object.keys(signals) as (keyof typeof signals)[])
    .filter(k => signals[k])

  const scoreBreakdown = [
    { dimension: 'studentImpact', score: priorityScore.studentImpact, weight: SCORING_WEIGHTS.studentImpact },
    { dimension: 'legalRisk', score: priorityScore.legalRisk, weight: SCORING_WEIGHTS.legalRisk },
    { dimension: 'usageFrequency', score: priorityScore.usageFrequency, weight: SCORING_WEIGHTS.usageFrequency },
    { dimension: 'contentReplaceability', score: priorityScore.contentReplaceability, weight: SCORING_WEIGHTS.contentReplaceability },
    { dimension: 'timeSensitivity', score: priorityScore.timeSensitivity, weight: SCORING_WEIGHTS.timeSensitivity },
  ].map(d => ({ ...d, weighted: d.score * d.weight }))

  const rawTotal = scoreBreakdown.reduce((sum, d) => sum + d.weighted, 0)

  const rule =
    decision === 'fix' && signals.publicFacing && signals.missionCritical
      ? 'Rule 1 — public-facing + mission-critical + active → fix'
      : decision === 'delete' && (signals.likelyLowValue || signals.betterAsHTML)
      ? 'Rule 2 — outdated / low-value / better as HTML → delete'
      : 'Rule 3 — ownership unclear or value uncertain → review'

  const priorityBand =
    priorityScore.total >= PRIORITY_THRESHOLDS.high
      ? `High (score ≥ ${PRIORITY_THRESHOLDS.high})`
      : priorityScore.total >= PRIORITY_THRESHOLDS.medium
      ? `Medium (score ≥ ${PRIORITY_THRESHOLDS.medium})`
      : `Low (score < ${PRIORITY_THRESHOLDS.medium})`

  return {
    timestamp: timestamp ?? new Date().toISOString(),
    actor: 'accessflow-pipeline',
    rule,
    activeSignals,
    scoreBreakdown,
    rawTotal,
    normalizedScore: priorityScore.total,
    priorityBand,
    confidenceGated: confidence < 65,
  }
}
