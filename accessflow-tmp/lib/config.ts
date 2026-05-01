export const GEMINI_MODEL = 'gemini-2.5-flash'

export const DECISION_LABELS = {
  fix: 'Fix now',
  review: 'Needs review',
  delete: 'Delete / replace',
} as const

export const STORAGE_KEYS = {
  queue: 'accessflow_queue',
  expertUnlocked: 'accessflow_expert_unlocked',
  theme: 'accessflow_theme',
} as const

export const ACTIVE_STATUSES = ['new', 'assigned', 'in-progress'] as const

export const REMEDIATION_RATE_USD = 150

export const EFFORT_HOURS = {
  '10 min': 10 / 60,
  '2 hours': 2,
  'multi-team project': 20,
} as const

export const EXTRACT_LIMITS = {
  pdf: 4000,
  url: 3000,
  technicalReview: 2000,
} as const

export const FETCH_TIMEOUT_MS = 8000

export function getGeminiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY is not configured on this deployment')
  return key
}
