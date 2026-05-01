export type Decision = 'fix' | 'review' | 'delete'
export type Priority = 'High' | 'Medium' | 'Low'
export type Role = 'staff' | 'faculty' | 'admin' | 'student'
export type ContentType = 'url' | 'pdf'
export type EffortLevel = '10 min' | '2 hours' | 'multi-team project'
export type UsageSignal = 'high-traffic' | 'seasonal' | 'archived' | 'unknown'
export type ItemStatus = 'new' | 'assigned' | 'in-progress' | 'fixed' | 'archived' | 'exempted'

export interface PriorityScore {
  studentImpact: number
  legalRisk: number
  usageFrequency: number
  contentReplaceability: number
  timeSensitivity: number
  total: number
}

export interface TriageSignals {
  publicFacing: boolean
  studentImpact: boolean
  betterAsHTML: boolean
  likelyLowValue: boolean
  timeSensitive: boolean
  missionCritical: boolean
}

export interface TriageResult {
  decision: Decision
  priority: Priority
  contentDescription: string
  why: string
  action: string
  owner: string
  confidence: number
  signals: TriageSignals
  priorityScore: PriorityScore
  estimatedEffort: EffortLevel
  usageSignal: UsageSignal
  wcagContext?: string
  roleNote?: string
}

export interface QueueItem {
  id: string
  label: string
  type: ContentType
  role: Role
  result: TriageResult
  status: ItemStatus
  createdAt: string
  updatedAt: string
  assignedTo?: string
  department?: string
  deadline?: string
}

export type IssueSeverity = 'Critical' | 'High' | 'Medium' | 'Low'

export interface TechnicalIssue {
  id: string
  title: string
  wcag: string           // e.g. "WCAG 2.1 AA 1.3.1 / 4.1.2"
  severity: IssueSeverity
  location?: string      // e.g. "line 142" or "page 3"
  problem: string        // plain description of what's broken
  detailedReason: string // technical root cause, affected users, and real-world impact
  quickFix: string       // one-line non-technical fix
  technicalFix: string   // developer-level instruction
  codeExample?: string   // HTML/CSS snippet
  ownerSuggestion: string
}

export interface TechnicalReview {
  summary: string
  issues: TechnicalIssue[]
  scanConfidence: number
}

export interface AnalysisInput {
  type: ContentType
  value: string
  filename?: string
  role: Role
  metadata?: {
    title?: string
    pageCount?: number
    hasImages?: boolean
    hasForms?: boolean
    hasHeadings?: boolean
    language?: string
    lastModified?: string
    missionCritical?: boolean
    likelyLowValue?: boolean
    betterAsHTML?: boolean
    studentImpact?: boolean
  }
}
