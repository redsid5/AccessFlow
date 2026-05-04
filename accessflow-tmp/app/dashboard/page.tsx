'use client'

import { useEffect, useState } from 'react'
import { getQueue, computeStats, remediationCost, DashboardStats } from '@/lib/queue-store'
import { DECISION_LABELS } from '@/lib/config'
import { QueueItem } from '@/lib/types'

function fmt(n: number) {
  return `$${n.toLocaleString()}`
}

function StatBlock({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="border border-[#e5e4df] dark:border-[#536878] dark:bg-[#3a4d59] px-4 sm:px-5 py-4">
      <p className="text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660] mb-1">{label}</p>
      <p className="text-3xl font-bold text-[#111] dark:text-[#ededea] tracking-tight leading-none">{value}</p>
      {sub && <p className="text-xs font-mono text-[#888] dark:text-[#666660] mt-1">{sub}</p>}
    </div>
  )
}

function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-[#888] dark:text-[#666660] w-28 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-1 bg-[#EBE8E0] dark:bg-[#4d6373]">
        <div className="h-1 bg-[#111] dark:bg-[#ededea] transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-[#555] dark:text-[#9e9e98] w-8 shrink-0">{value}</span>
    </div>
  )
}

export default function DashboardPage() {
  const [items, setItems] = useState<QueueItem[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)

  function reload() {
    const q = getQueue()
    setItems(q)
    setStats(computeStats(q))
  }

  useEffect(() => {
    reload()
    window.addEventListener('accessflow:queue-updated', reload)
    return () => window.removeEventListener('accessflow:queue-updated', reload)
  }, [])

  if (!stats) return null

  const totalCostIfAllFixed = items
    .filter(i => i.result.decision !== 'delete')
    .reduce((sum, i) => sum + remediationCost(i), 0)

  const costAfterDeletion = items
    .filter(i => i.result.decision === 'fix' || i.result.decision === 'review')
    .reduce((sum, i) => sum + remediationCost(i), 0)

  const highRiskUnresolved = items.filter(
    i => i.result.decision === 'fix' &&
      i.result.priority === 'High' &&
      !['fixed', 'archived', 'exempted'].includes(i.status)
  )

  const byDepartment: Record<string, { total: number; fix: number; cost: number }> = {}
  for (const item of items) {
    const dept = item.department || 'Unassigned'
    if (!byDepartment[dept]) byDepartment[dept] = { total: 0, fix: 0, cost: 0 }
    byDepartment[dept].total++
    if (item.result.decision === 'fix') byDepartment[dept].fix++
    byDepartment[dept].cost += remediationCost(item)
  }

  const deptList = Object.entries(byDepartment).sort((a, b) => b[1].cost - a[1].cost)
  const maxDeptCost = Math.max(...deptList.map(d => d[1].cost), 1)

  return (
    <main className="min-h-screen px-4 sm:px-5 pb-16">
      <div className="max-w-[860px] mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111] dark:text-[#ededea] tracking-tight">Portfolio Dashboard</h1>
          <p className="text-base text-[#555] dark:text-[#9e9e98] mt-1">
            {stats.total} items analyzed Â· {stats.resolvedThisMonth} resolved this month
          </p>
        </div>

        {stats.total === 0 ? (
          <div className="border border-[#e5e4df] dark:border-[#536878] dark:bg-[#3a4d59] px-5 py-10 text-center">
            <p className="text-base text-[#888] dark:text-[#666660] font-mono">No data yet.</p>
            <p className="text-sm text-[#aaa] dark:text-[#444440] font-mono mt-1">
              Analyze content on the{' '}
              <a href="/" className="underline text-[#555] dark:text-[#9e9e98]">Analyze page</a> to populate the dashboard.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px mb-px">
              <StatBlock label="Total items" value={stats.total} />
              <StatBlock label="Critical unresolved" value={stats.criticalUnresolved} sub="Fix now / High priority" />
              <StatBlock label="Resolved this month" value={stats.resolvedThisMonth} />
              <StatBlock label="Remediation cost" value={fmt(costAfterDeletion)} sub="after removing low-value content" />
            </div>

            <div className="border border-[#e5e4df] dark:border-[#536878] dark:bg-[#3a4d59] p-4 sm:p-5 mt-px mb-8">
              <p className="text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660] mb-4">Cost analysis</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <p className="text-xs font-mono text-[#888] dark:text-[#666660] mb-1">If everything remediated</p>
                  <p className="text-2xl font-bold text-[#111] dark:text-[#ededea]">{fmt(totalCostIfAllFixed)}</p>
                  <p className="text-xs font-mono text-[#aaa] dark:text-[#444440] mt-1">at $150/hr accessibility specialist rate</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-[#888] dark:text-[#666660] mb-1">Projected savings from deletion</p>
                  <p className="text-2xl font-bold text-[#111] dark:text-[#ededea]">{fmt(stats.projectedSavings)}</p>
                  <p className="text-xs font-mono text-[#aaa] dark:text-[#444440] mt-1">{stats.byDecision.delete} items flagged for removal</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-[#888] dark:text-[#666660] mb-1">Actual remediation needed</p>
                  <p className="text-2xl font-bold text-[#111] dark:text-[#ededea]">{fmt(costAfterDeletion)}</p>
                  <p className="text-xs font-mono text-[#aaa] dark:text-[#444440] mt-1">
                    {totalCostIfAllFixed > 0
                      ? `${Math.round((stats.projectedSavings / totalCostIfAllFixed) * 100)}% reduction`
                      : 'â€”'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px mb-px">
              <div className="border border-[#e5e4df] dark:border-[#536878] dark:bg-[#3a4d59] p-4 sm:p-5">
                <p className="text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660] mb-4">By decision</p>
                <div className="space-y-3">
                  <Bar value={stats.byDecision.fix} max={stats.total} label={DECISION_LABELS.fix} />
                  <Bar value={stats.byDecision.review} max={stats.total} label={DECISION_LABELS.review} />
                  <Bar value={stats.byDecision.delete} max={stats.total} label={DECISION_LABELS.delete} />
                </div>
              </div>
              <div className="border border-[#e5e4df] dark:border-[#536878] dark:bg-[#3a4d59] p-4 sm:p-5">
                <p className="text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660] mb-4">By status</p>
                <div className="space-y-3">
                  {(Object.entries(stats.byStatus) as [string, number][])
                    .filter(([, v]) => v > 0)
                    .map(([s, v]) => (
                      <Bar key={s} value={v} max={stats.total} label={s} />
                    ))}
                </div>
              </div>
            </div>

            {highRiskUnresolved.length > 0 && (
              <div className="border border-[#e5e4df] dark:border-[#536878] dark:bg-[#3a4d59] p-4 sm:p-5 mt-px mb-px">
                <p className="text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660] mb-3">
                  Critical â€” unresolved ({highRiskUnresolved.length})
                </p>
                <div className="space-y-3">
                  {highRiskUnresolved.slice(0, 5).map(item => (
                    <div key={item.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-mono text-[#111] dark:text-[#ededea] truncate">{item.label}</p>
                        <p className="text-xs text-[#888] dark:text-[#666660]">{item.result.why}</p>
                      </div>
                      <span className="text-xs font-mono text-[#888] dark:text-[#666660] shrink-0">{fmt(remediationCost(item))}</span>
                    </div>
                  ))}
                  {highRiskUnresolved.length > 5 && (
                    <p className="text-xs font-mono text-[#aaa] dark:text-[#444440]">
                      +{highRiskUnresolved.length - 5} more â†’{' '}
                      <a href="/queue" className="underline text-[#555] dark:text-[#9e9e98]">view queue</a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {deptList.length > 0 && (
              <div className="border border-[#e5e4df] dark:border-[#536878] dark:bg-[#3a4d59] p-4 sm:p-5 mt-px">
                <p className="text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660] mb-4">By department</p>
                <div className="space-y-3">
                  {deptList.map(([dept, d]) => (
                    <div key={dept} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[#888] dark:text-[#666660] w-28 shrink-0 text-right truncate">{dept}</span>
                      <div className="flex-1 h-1 bg-[#EBE8E0] dark:bg-[#4d6373]">
                        <div
                          className="h-1 bg-[#111] dark:bg-[#ededea]"
                          style={{ width: `${(d.cost / maxDeptCost) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-[#555] dark:text-[#9e9e98] w-20 shrink-0 text-right">
                        {fmt(d.cost)}
                      </span>
                      <span className="text-xs font-mono text-[#aaa] dark:text-[#444440] w-16 shrink-0">
                        {d.total} item{d.total !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
