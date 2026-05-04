export type PatternBucket =
  | 'navigation'
  | 'forms'
  | 'buttons-links'
  | 'search'
  | 'media'
  | 'document-pdf'
  | 'layout-template'

export type ScopeLikelihood = 'global' | 'template' | 'local'
export type Decision = 'FIX' | 'DELETE' | 'REVIEW'
export type QueueStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'VERIFIED' | 'ARCHIVED' | 'REVIEW_REQUIRED'
export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type Priority = 'high' | 'medium' | 'low'
export type Role = 'staff' | 'developer' | 'admin' | 'student'

export interface NormalizedIssue {
  id: string
  sourceType: 'url' | 'pdf'
  sourceId: string
  sourceTitle: string
  pageUrl?: string
  pagePath?: string
  department?: string

  canonicalKey: string
  wcagCode?: string
  severity: Severity
  issueTitle: string
  issueSummary: string
  evidence: string[]

  patternBucket: PatternBucket

  signals: {
    publicFacing: boolean
    missionCritical: boolean
    timeSensitive: boolean
    lowValue: boolean
    betterAsHtml: boolean
    legalRisk: number
    studentImpact: number
    usageFrequency: number
    replaceability: number
    timeSensitivity: number
  }

  scopeInference: {
    likelihood: ScopeLikelihood
    confidence: number
    reasons: string[]
  }

  decisionSignals: {
    extractorConfidence: number
    contradictions: string[]
  }
}

export interface FixOpportunity {
  id: string
  patternBucket: PatternBucket
  canonicalKey: string
  title: string
  summary: string

  scope: {
    likelihood: ScopeLikelihood
    confidence: number
  }

  decision: Decision
  priority: Priority
  owner: {
    team: string
    role: string
  }

  fixLocation: string
  actionLine: string
  verificationChecklist: string[]

  rawIssueIds: string[]
  affectedSources: {
    sourceId: string
    sourceTitle: string
    pageUrl?: string
  }[]

  rawIssueCount: number
  affectedSourceCount: number
  consolidatedFixCount: 1
  compressionRatio: number

  decisionTrace: {
    rulePath: string[]
    groupedBecause: string[]
    scopeReasons: string[]
    timestamp: string
  }

  status: QueueStatus
  createdAt: string
  updatedAt: string
}

export interface AnalysisV2Result {
  sourceId: string
  sourceTitle: string
  sourceType: 'url' | 'pdf'
  pageUrl?: string
  rawIssues: NormalizedIssue[]
  fixOpportunities: FixOpportunity[]
  compressionRatio: number
}
