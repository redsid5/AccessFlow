'use client'

import { useEffect, useRef, useState } from 'react'
import { QueueItem, ItemStatus, Role } from '@/lib/types'
import { getQueue, updateQueueItem, removeFromQueue, addToQueue, remediationCost } from '@/lib/queue-store'

const STATUS_LABELS: Record<ItemStatus, string> = {
  new: 'New',
  assigned: 'Assigned',
  'in-progress': 'In progress',
  fixed: 'Fixed',
  archived: 'Archived',
  exempted: 'Exempted',
}

const STATUS_STYLE: Record<ItemStatus, string> = {
  new: 'border-[#111] text-[#111]',
  assigned: 'border-[#888] text-[#888]',
  'in-progress': 'border-[#888] text-[#888]',
  fixed: 'border-[#aaa] text-[#aaa]',
  archived: 'border-[#ccc] text-[#ccc]',
  exempted: 'border-[#ccc] text-[#ccc]',
}

const DECISION_MARKER = { fix: '!', review: '?', delete: '×' }

const DEPARTMENTS = [
  'Registrar', 'Financial Aid', 'Disability Services', 'Housing',
  'Admissions', 'Web Team', 'IT Services', 'Student Affairs',
  'Faculty Affairs', 'Library', 'Athletics', 'Other',
]

export default function QueuePage() {
  const [items, setItems] = useState<QueueItem[]>([])
  const [filterStatus, setFilterStatus] = useState<ItemStatus | 'all'>('all')
  const [filterDecision, setFilterDecision] = useState<string>('all')
  const [bulkFiles, setBulkFiles] = useState<File[]>([])
  const [bulkRole, setBulkRole] = useState<Role>('staff')
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function reload() {
    setItems(getQueue())
  }

  useEffect(() => {
    reload()
    window.addEventListener('accessflow:queue-updated', reload)
    return () => window.removeEventListener('accessflow:queue-updated', reload)
  }, [])

  function setStatus(id: string, status: ItemStatus) {
    updateQueueItem(id, { status })
    reload()
    window.dispatchEvent(new Event('accessflow:queue-updated'))
  }

  function setDepartment(id: string, department: string) {
    updateQueueItem(id, { department })
    reload()
  }

  function setAssignedTo(id: string, assignedTo: string) {
    updateQueueItem(id, { assignedTo, status: 'assigned' })
    reload()
    window.dispatchEvent(new Event('accessflow:queue-updated'))
  }

  function remove(id: string) {
    removeFromQueue(id)
    reload()
    window.dispatchEvent(new Event('accessflow:queue-updated'))
  }

  async function runBulkAnalysis() {
    if (!bulkFiles.length) return
    setBulkProgress({ done: 0, total: bulkFiles.length })
    setBulkError(null)

    for (let i = 0; i < bulkFiles.length; i++) {
      const file = bulkFiles[i]
      try {
        const form = new FormData()
        form.append('file', file)
        form.append('role', bulkRole)
        const res = await fetch('/api/analyze-pdf', { method: 'POST', body: form })
        if (!res.ok) throw new Error('Analysis failed')
        const result = await res.json()
        addToQueue(file.name, 'pdf', bulkRole, result)
        window.dispatchEvent(new Event('accessflow:queue-updated'))
      } catch {
        setBulkError(`Failed on: ${file.name}`)
      }
      setBulkProgress({ done: i + 1, total: bulkFiles.length })
    }

    setBulkFiles([])
    reload()
    window.dispatchEvent(new Event('accessflow:queue-updated'))
  }

  const displayed = items.filter(item => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false
    if (filterDecision !== 'all' && item.result.decision !== filterDecision) return false
    return true
  })

  const activeCount = items.filter(i => ['new', 'assigned', 'in-progress'].includes(i.status)).length

  return (
    <main className="min-h-screen px-5 pb-16">
      <div className="max-w-[860px] mx-auto">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#111] tracking-tight">Intake Queue</h1>
          <p className="text-sm text-[#555] mt-1">
            {activeCount} active item{activeCount !== 1 ? 's' : ''} · {items.length} total
          </p>
        </div>

        {/* Bulk upload */}
        <div className="border border-[#e5e5e5] p-5 mb-8">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#888] mb-3">Bulk PDF triage</p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs font-mono border border-[#e5e5e5] px-3 py-2 hover:border-[#111] transition-colors"
            >
              {bulkFiles.length > 0 ? `${bulkFiles.length} file${bulkFiles.length > 1 ? 's' : ''} selected` : 'Select PDFs'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={e => setBulkFiles(Array.from(e.target.files || []))}
            />
            <select
              value={bulkRole}
              onChange={e => setBulkRole(e.target.value as Role)}
              className="text-xs font-mono border border-[#e5e5e5] px-3 py-2 text-[#111] focus:outline-none focus:border-[#111]"
            >
              <option value="staff">Accessibility staff</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Department admin</option>
              <option value="student">Student worker</option>
            </select>
            <button
              onClick={runBulkAnalysis}
              disabled={!bulkFiles.length || !!bulkProgress}
              className="text-xs font-mono bg-[#111] text-white px-4 py-2 disabled:opacity-30 hover:bg-[#333] transition-colors"
            >
              {bulkProgress
                ? `Analyzing ${bulkProgress.done}/${bulkProgress.total}...`
                : 'Analyze all'}
            </button>
          </div>
          {bulkError && <p className="text-xs font-mono text-[#888] mt-2">{bulkError}</p>}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          {(['all', 'new', 'assigned', 'in-progress', 'fixed', 'archived', 'exempted'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-[10px] font-mono px-2 py-1 border transition-colors ${
                filterStatus === s ? 'border-[#111] bg-[#111] text-white' : 'border-[#e5e5e5] text-[#888] hover:border-[#111]'
              }`}
            >
              {s === 'all' ? 'All statuses' : STATUS_LABELS[s]}
            </button>
          ))}
          <span className="text-[#e5e5e5]">|</span>
          {(['all', 'fix', 'review', 'delete'] as const).map(d => (
            <button
              key={d}
              onClick={() => setFilterDecision(d)}
              className={`text-[10px] font-mono px-2 py-1 border transition-colors ${
                filterDecision === d ? 'border-[#111] bg-[#111] text-white' : 'border-[#e5e5e5] text-[#888] hover:border-[#111]'
              }`}
            >
              {d === 'all' ? 'All decisions' : d === 'fix' ? 'Fix now' : d === 'review' ? 'Review' : 'Delete'}
            </button>
          ))}
        </div>

        {/* Queue table */}
        {displayed.length === 0 ? (
          <div className="border border-[#e5e5e5] px-5 py-10 text-center">
            <p className="text-sm text-[#888] font-mono">No items match this filter.</p>
            {items.length === 0 && (
              <p className="text-xs text-[#aaa] font-mono mt-1">
                Analyze a URL or PDF on the{' '}
                <a href="/" className="underline text-[#555]">Analyze page</a> to add items.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-px">
            {displayed.map(item => (
              <div key={item.id} className={`border border-[#e5e5e5] px-4 py-3 ${
                ['fixed', 'archived', 'exempted'].includes(item.status) ? 'opacity-50' : ''
              }`}>
                <div className="flex items-start gap-3 flex-wrap">

                  {/* Decision marker */}
                  <span className="font-mono text-sm font-bold text-[#111] w-4 shrink-0 mt-0.5">
                    {DECISION_MARKER[item.result.decision]}
                  </span>

                  {/* Content info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-[#111] truncate">{item.label}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-[#888]">{item.result.contentDescription}</span>
                      <span className="text-[10px] font-mono text-[#aaa]">{item.result.priority} priority</span>
                      <span className="text-[10px] font-mono text-[#aaa]">{item.result.estimatedEffort}</span>
                      <span className="text-[10px] font-mono text-[#aaa]">
                        ${remediationCost(item).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Department */}
                    <select
                      value={item.department || ''}
                      onChange={e => setDepartment(item.id, e.target.value)}
                      className="text-[10px] font-mono border border-[#e5e5e5] px-2 py-1 text-[#555] focus:outline-none focus:border-[#111] max-w-[120px]"
                    >
                      <option value="">Department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    {/* Assigned to */}
                    <input
                      type="text"
                      placeholder="Assign to..."
                      defaultValue={item.assignedTo || ''}
                      onBlur={e => { if (e.target.value) setAssignedTo(item.id, e.target.value) }}
                      className="text-[10px] font-mono border border-[#e5e5e5] px-2 py-1 text-[#111] placeholder-[#ccc] focus:outline-none focus:border-[#111] w-24"
                    />

                    {/* Status */}
                    <select
                      value={item.status}
                      onChange={e => setStatus(item.id, e.target.value as ItemStatus)}
                      className={`text-[10px] font-mono border px-2 py-1 focus:outline-none focus:border-[#111] ${STATUS_STYLE[item.status]}`}
                    >
                      {(Object.keys(STATUS_LABELS) as ItemStatus[]).map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>

                    {/* Remove */}
                    <button
                      onClick={() => remove(item.id)}
                      className="text-[10px] font-mono text-[#ccc] hover:text-[#111] transition-colors px-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Why */}
                <p className="text-[10px] text-[#888] mt-2 ml-7 leading-relaxed">{item.result.why}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
