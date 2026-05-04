import { FixOpportunity, QueueStatus, PatternBucket } from './v2-types'

const STORAGE_KEY = 'accessflow_v2_queue'

export interface QueueGroup {
  bucket: PatternBucket
  fixes: FixOpportunity[]
  totalRawIssues: number
  totalSources: number
}

function load(): FixOpportunity[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as FixOpportunity[]) : []
  } catch {
    return []
  }
}

function save(items: FixOpportunity[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function getQueue(): FixOpportunity[] {
  return load()
}

export function addFixOpportunities(incoming: FixOpportunity[]): void {
  const existing = load()
  const existingKeys = new Set(existing.map(f => f.canonicalKey))

  for (const fix of incoming) {
    if (existingKeys.has(fix.canonicalKey)) {
      // Merge: accumulate sources and raw issues into existing entry
      const idx = existing.findIndex(f => f.canonicalKey === fix.canonicalKey)
      if (idx !== -1) {
        const prev = existing[idx]
        const mergedSources = deduplicateSources([...prev.affectedSources, ...fix.affectedSources])
        const mergedIssueIds = [...new Set([...prev.rawIssueIds, ...fix.rawIssueIds])]
        existing[idx] = {
          ...prev,
          rawIssueIds: mergedIssueIds,
          affectedSources: mergedSources,
          rawIssueCount: mergedIssueIds.length,
          affectedSourceCount: mergedSources.length,
          compressionRatio: mergedIssueIds.length,
          updatedAt: new Date().toISOString(),
          // Escalate priority if incoming is higher
          priority: higherPriority(prev.priority, fix.priority),
        }
      }
    } else {
      existing.push(fix)
      existingKeys.add(fix.canonicalKey)
    }
  }

  save(existing)
}

export function updateStatus(id: string, status: QueueStatus): void {
  const items = load()
  const idx = items.findIndex(f => f.id === id)
  if (idx !== -1) {
    items[idx] = { ...items[idx], status, updatedAt: new Date().toISOString() }
    save(items)
  }
}

export function removeFromQueue(id: string): void {
  const items = load().filter(f => f.id !== id)
  save(items)
}

export function clearQueue(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

export function groupByBucket(items: FixOpportunity[]): QueueGroup[] {
  const map = new Map<PatternBucket, FixOpportunity[]>()
  for (const fix of items) {
    const bucket = fix.patternBucket
    if (!map.has(bucket)) map.set(bucket, [])
    map.get(bucket)!.push(fix)
  }

  const BUCKET_ORDER: PatternBucket[] = [
    'navigation', 'forms', 'buttons-links', 'search',
    'media', 'document-pdf', 'layout-template',
  ]

  return BUCKET_ORDER
    .filter(b => map.has(b))
    .map(b => {
      const fixes = map.get(b)!
      return {
        bucket: b,
        fixes: fixes.sort((a, z) => priorityRank(z.priority) - priorityRank(a.priority)),
        totalRawIssues: fixes.reduce((s, f) => s + f.rawIssueCount, 0),
        totalSources: new Set(fixes.flatMap(f => f.affectedSources.map(s => s.sourceId))).size,
      }
    })
}

export function getCompressionStats(items: FixOpportunity[]): {
  rawIssues: number
  consolidatedFixes: number
  compressionRatio: number
} {
  const rawIssues = items.reduce((s, f) => s + f.rawIssueCount, 0)
  const consolidatedFixes = items.length
  return {
    rawIssues,
    consolidatedFixes,
    compressionRatio: consolidatedFixes > 0 ? rawIssues / consolidatedFixes : 0,
  }
}

function deduplicateSources(
  sources: FixOpportunity['affectedSources']
): FixOpportunity['affectedSources'] {
  const seen = new Map<string, FixOpportunity['affectedSources'][number]>()
  for (const s of sources) {
    if (!seen.has(s.sourceId)) seen.set(s.sourceId, s)
  }
  return Array.from(seen.values())
}

function higherPriority(a: 'high' | 'medium' | 'low', b: 'high' | 'medium' | 'low') {
  return priorityRank(a) >= priorityRank(b) ? a : b
}

function priorityRank(p: 'high' | 'medium' | 'low'): number {
  return p === 'high' ? 2 : p === 'medium' ? 1 : 0
}
