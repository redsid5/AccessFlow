import { NormalizedIssue, ScopeLikelihood } from './v2-types'

export interface IssueCluster {
  clusterKey: string
  canonicalKey: string
  patternBucket: NormalizedIssue['patternBucket']
  issues: NormalizedIssue[]
  dominantScope: ScopeLikelihood
  scopeConfidence: number
  scopeReasons: string[]
}

export function clusterIssues(issues: NormalizedIssue[]): IssueCluster[] {
  const map = new Map<string, IssueCluster>()

  for (const issue of issues) {
    const key = buildClusterKey(issue)

    if (!map.has(key)) {
      map.set(key, {
        clusterKey: key,
        canonicalKey: issue.canonicalKey,
        patternBucket: issue.patternBucket,
        issues: [],
        dominantScope: issue.scopeInference.likelihood,
        scopeConfidence: issue.scopeInference.confidence,
        scopeReasons: [],
      })
    }

    map.get(key)!.issues.push(issue)
  }

  for (const cluster of map.values()) {
    resolveClusterScope(cluster)
  }

  return Array.from(map.values()).sort((a, b) => b.issues.length - a.issues.length)
}

function buildClusterKey(issue: NormalizedIssue): string {
  return `${issue.patternBucket}::${issue.canonicalKey}`
}

function resolveClusterScope(cluster: IssueCluster): void {
  const scopes = cluster.issues.map(i => i.scopeInference.likelihood)
  const sources = new Set(cluster.issues.map(i => i.sourceId))
  const reasons = new Set<string>()

  cluster.issues.forEach(i => i.scopeInference.reasons.forEach(r => reasons.add(r)))

  // More sources → stronger scope
  if (sources.size >= 4) {
    cluster.dominantScope = 'global'
    cluster.scopeConfidence = Math.min(0.95, 0.7 + sources.size * 0.05)
    reasons.add(`Pattern found across ${sources.size} distinct sources`)
  } else if (sources.size >= 2) {
    const globalCount = scopes.filter(s => s === 'global').length
    const templateCount = scopes.filter(s => s === 'template').length

    if (globalCount > templateCount) {
      cluster.dominantScope = 'global'
      cluster.scopeConfidence = 0.75 + sources.size * 0.03
      reasons.add(`Majority of issues suggest global scope`)
    } else {
      cluster.dominantScope = 'template'
      cluster.scopeConfidence = 0.7
      reasons.add(`Pattern repeats across ${sources.size} sources — likely template-level`)
    }
  } else {
    // Single source: use highest-confidence scope from issues
    const best = cluster.issues.reduce(
      (a, b) => a.scopeInference.confidence > b.scopeInference.confidence ? a : b
    )
    cluster.dominantScope = best.scopeInference.likelihood
    cluster.scopeConfidence = best.scopeInference.confidence
  }

  cluster.scopeReasons = Array.from(reasons).slice(0, 3)
}
