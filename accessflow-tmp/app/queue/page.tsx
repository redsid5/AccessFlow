'use client'

import { useEffect, useState } from 'react'
import { FixOpportunity, QueueStatus, PatternBucket } from '@/lib/v2-types'
import { getQueue, updateStatus, removeFromQueue, groupByBucket, getCompressionStats, QueueGroup } from '@/lib/v2-queue'
import { FixCard } from '@/components/v2/FixCard'

const BUCKET_LABEL: Record<PatternBucket, string> = {
  'navigation': 'Navigation',
  'forms': 'Forms',
  'buttons-links': 'Buttons & Links',
  'search': 'Search',
  'media': 'Media',
  'document-pdf': 'Documents / PDF',
  'layout-template': 'Layout & Template',
}

const STATUS_FILTERS: { value: QueueStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'REVIEW_REQUIRED', label: 'Needs review' },
]

export default function QueuePage() {
  const [items, setItems] = useState<FixOpportunity[]>([])
  const [filterStatus, setFilterStatus] = useState<QueueStatus | 'all'>('all')

  function reload() {
    setItems(getQueue())
  }

  useEffect(() => {
    reload()
    window.addEventListener('accessflow:queue-updated', reload)
    return () => window.removeEventListener('accessflow:queue-updated', reload)
  }, [])

  function handleStatusChange(id: string, status: QueueStatus) {
    updateStatus(id, status)
    reload()
  }

  function handleRemove(id: string) {
    removeFromQueue(id)
    reload()
  }

  const filtered = filterStatus === 'all'
    ? items
    : items.filter(f => f.status === filterStatus)

  const groups: QueueGroup[] = groupByBucket(filtered)
  const stats = getCompressionStats(items)

  return (
    <main className="min-h-screen px-4 sm:px-5 pb-20">
      <div className="max-w-[860px] mx-auto">

        <div className="pt-12 pb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#111] dark:text-[#ededea] tracking-tight">
            Fix Queue
          </h1>
          <p className="text-base text-[#555] dark:text-[#9e9e98] mt-2">
            {items.length} consolidated fix{items.length !== 1 ? 's' : ''} from {stats.rawIssues} raw issues
          </p>
        </div>

        {/* Compression stats */}
        {items.length > 0 && (
          <div className="border border-[#e5e4df] dark:border-[#2c2c2a] dark:bg-[#1c1c1a] px-4 py-3 mb-6 flex flex-wrap gap-6">
            <Stat label="Raw issues" value={stats.rawIssues.toString()} />
            <Stat label="Consolidated fixes" value={stats.consolidatedFixes.toString()} />
            <Stat label="Compression ratio" value={`${stats.compressionRatio.toFixed(1)}:1`} />
          </div>
        )}

        {/* Status filter */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`text-xs font-mono px-2.5 py-1.5 border transition-colors ${
                filterStatus === f.value
                  ? 'border-[#111] dark:border-[#ededea] bg-[#111] dark:bg-[#ededea] text-white dark:text-[#111]'
                  : 'border-[#e5e4df] dark:border-[#2c2c2a] text-[#888] dark:text-[#666660] hover:border-[#111] dark:hover:border-[#ededea]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="border border-[#e5e4df] dark:border-[#2c2c2a] dark:bg-[#1c1c1a] px-5 py-12 text-center">
            <p className="text-sm font-mono text-[#888] dark:text-[#666660]">
              {items.length === 0
                ? 'No items in queue.'
                : 'No items match this filter.'}
            </p>
            {items.length === 0 && (
              <p className="text-xs font-mono text-[#aaa] dark:text-[#444440] mt-1">
                Analyze a URL or PDF on the{' '}
                <a href="/" className="underline text-[#555] dark:text-[#9e9e98]">Analyze page</a>
                {' '}to populate the queue.
              </p>
            )}
          </div>
        )}

        {/* Grouped by bucket */}
        {groups.map(group => (
          <div key={group.bucket} className="mb-8">
            <div className="flex items-baseline gap-3 mb-2">
              <h2 className="text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660]">
                {BUCKET_LABEL[group.bucket]}
              </h2>
              <span className="text-xs font-mono text-[#aaa] dark:text-[#444440]">
                {group.fixes.length} fix{group.fixes.length !== 1 ? 'es' : ''}
                {' · '}
                {group.totalRawIssues} issue{group.totalRawIssues !== 1 ? 's' : ''}
                {' · '}
                {group.totalSources} source{group.totalSources !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-px">
              {group.fixes.map(fix => (
                <FixCard
                  key={fix.id}
                  fix={fix}
                  showStatus
                  onStatusChange={handleStatusChange}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-mono text-[#888] dark:text-[#666660]">{label}</p>
      <p className="text-xl font-bold text-[#111] dark:text-[#ededea]">{value}</p>
    </div>
  )
}
