import type { PriorityScore } from './types'

// Scoring weights for the priority formula.
// These are intentional design decisions, not arbitrary numbers:
//
//  studentImpact × 2   — direct harm to students is our primary signal
//  legalRisk × 2       — DOJ Title II exposure is existential for universities
//  timeSensitivity × 2 — deadline-driven content must ship on time
//  usageFrequency × 1  — matters, but less than who is affected
//  replaceability × 1  — replaceability informs strategy, not urgency
//
// Max raw score = 8 × 10 = 80. Normalized to 0–100.

export const SCORING_WEIGHTS = {
  studentImpact: 2,
  legalRisk: 2,
  usageFrequency: 1,
  contentReplaceability: 1,
  timeSensitivity: 2,
} as const

const WEIGHT_SUM = Object.values(SCORING_WEIGHTS).reduce((a, b) => a + b, 0) // 8
const SUBSCORE_MAX = 10

// Compute the priority total deterministically from LLM-provided subscores.
// This ensures the total is never hallucinated — the LLM only provides the 5 inputs.
export function computePriorityTotal(scores: Omit<PriorityScore, 'total'>): number {
  const raw =
    scores.studentImpact * SCORING_WEIGHTS.studentImpact +
    scores.legalRisk * SCORING_WEIGHTS.legalRisk +
    scores.usageFrequency * SCORING_WEIGHTS.usageFrequency +
    scores.contentReplaceability * SCORING_WEIGHTS.contentReplaceability +
    scores.timeSensitivity * SCORING_WEIGHTS.timeSensitivity

  return Math.round((raw / (WEIGHT_SUM * SUBSCORE_MAX)) * 100)
}

// Priority band thresholds derived from the scoring model.
// High: 70+ (two or more critical signals at max)
// Medium: 40–69
// Low: <40
export const PRIORITY_THRESHOLDS = { high: 70, medium: 40 } as const
