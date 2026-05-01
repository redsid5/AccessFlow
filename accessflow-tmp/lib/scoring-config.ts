import type { PriorityScore } from './types'

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
