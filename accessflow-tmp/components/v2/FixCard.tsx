'use client'

import { useState } from 'react'
import { FixOpportunity, QueueStatus } from '@/lib/v2-types'
import {
  getEffort, getTimeSaved, getLeverageLabel,
  getNextStep, getTimeSavedReason,
} from '@/lib/v2-display'

const DECISION_STYLE: Record<string, string> = {
  FIX:    'bg-[#111] dark:bg-[#ededea] text-white dark:text-[#111]',
  REVIEW: 'border border-[#bbb] dark:border-[#444440] text-[#555] dark:text-[#9e9e98]',
  DELETE: 'border border-[#bbb] dark:border-[#444440] text-[#888] dark:text-[#666660]',
}

const PRIORITY_TEXT: Record<string, string> = {
  high:   'text-[#111] dark:text-[#ededea] font-medium',
  medium: 'text-[#888] dark:text-[#666660]',
  low:    'text-[#bbb] dark:text-[#444440]',
}

const EFFORT_LABEL: Record<string, string> = {
  small:  'small effort',
  medium: 'medium effort',
  large:  'large effort',
}

const BUCKET_LABEL: Record<string, string> = {
  'navigation':     'Navigation',
  'forms':          'Forms',
  'buttons-links':  'Buttons & Links',
  'search':         'Search',
  'media':          'Media',
  'document-pdf':   'Documents / PDF',
  'layout-template':'Layout & Template',
}

const STATUS_OPTIONS: { value: QueueStatus; label: string }[] = [
  { value: 'NEW',             label: 'New' },
  { value: 'ASSIGNED',        label: 'Assigned' },
  { value: 'IN_PROGRESS',     label: 'In progress' },
  { value: 'VERIFIED',        label: 'Verified' },
  { value: 'ARCHIVED',        label: 'Archived' },
  { value: 'REVIEW_REQUIRED', label: 'Needs review' },
]

interface FixCardProps {
  fix: FixOpportunity
  onStatusChange?: (id: string, status: QueueStatus) => void
  onRemove?: (id: string) => void
  showStatus?: boolean
}

export function FixCard({ fix, onStatusChange, onRemove, showStatus = false }: FixCardProps) {
  const [openSection, setOpenSection] = useState<string | null>(null)

  function toggle(key: string) {
    setOpenSection(prev => prev === key ? null : key)
  }

  const leverage   = getLeverageLabel(fix)
  const timeSaved  = getTimeSaved(fix)
  const effort     = getEffort(fix)
  const nextStep   = getNextStep(fix)
  const saveReason = getTimeSavedReason(fix)

  return (
    <div className="border border-[#e5e4df] dark:border-[#2c2c2a] dark:bg-[#1c1c1a]">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-2 flex items-start gap-3 flex-wrap">
        <span className={`text-xs font-mono px-2 py-0.5 shrink-0 mt-0.5 ${DECISION_STYLE[fix.decision]}`}>
          {fix.decision}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#111] dark:text-[#ededea] leading-snug">{fix.title}</p>
          <p className="text-xs font-mono text-[#888] dark:text-[#666660] mt-0.5">
            <span className={PRIORITY_TEXT[fix.priority]}>{fix.priority}</span>
            {' · '}
            {BUCKET_LABEL[fix.patternBucket] ?? fix.patternBucket}
            {' · '}
            {fix.rawIssueCount} issue{fix.rawIssueCount !== 1 ? 's' : ''} → 1 fix
            {' · '}
            {fix.affectedSourceCount} source{fix.affectedSourceCount !== 1 ? 's' : ''}
          </p>
        </div>

        {showStatus && onStatusChange && (
          <select
            value={fix.status}
            onChange={e => onStatusChange(fix.id, e.target.value as QueueStatus)}
            className="text-xs font-mono border border-[#e5e4df] dark:border-[#2c2c2a] bg-white dark:bg-[#1c1c1a] text-[#555] dark:text-[#9e9e98] px-2 py-1.5 focus:outline-none focus:border-[#111] dark:focus:border-[#ededea]"
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}

        {onRemove && (
          <button
            onClick={() => onRemove(fix.id)}
            aria-label="Remove fix"
            className="text-xs font-mono text-[#ccc] dark:text-[#333330] hover:text-[#111] dark:hover:text-[#ededea] transition-colors px-1 shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Value strip ────────────────────────────────────────── */}
      <div className="px-4 pb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        {leverage && (
          <span className="text-xs font-mono text-[#111] dark:text-[#ededea] border border-[#111] dark:border-[#ededea] px-1.5 py-0.5">
            {leverage}
          </span>
        )}
        {timeSaved && (
          <span className="text-xs font-mono text-[#555] dark:text-[#9e9e98]">{timeSaved}</span>
        )}
        <span className="text-xs font-mono text-[#aaa] dark:text-[#444440]">{EFFORT_LABEL[effort]}</span>
      </div>

      {/* ── Next step ──────────────────────────────────────────── */}
      <div className="px-4 pb-3 border-t border-[#e5e4df] dark:border-[#2c2c2a] pt-3">
        <p className="text-xs font-mono text-[#888] dark:text-[#666660] mb-0.5">Next step</p>
        <p className="text-sm text-[#111] dark:text-[#ededea]">{nextStep}</p>
        <p className="text-xs text-[#888] dark:text-[#666660] mt-1">
          Owner: {fix.owner.team} · {fix.owner.role}
        </p>
      </div>

      {/* ── Why this saves time ────────────────────────────────── */}
      <div className="px-4 py-2.5 border-t border-[#e5e4df] dark:border-[#2c2c2a]">
        <p className="text-xs text-[#888] dark:text-[#666660] leading-relaxed">{saveReason}</p>
      </div>

      {/* ── Accordions ─────────────────────────────────────────── */}
      <div className="border-t border-[#e5e4df] dark:border-[#2c2c2a]">
        <AccordionRow
          label="Decision rationale"
          open={openSection === 'why'}
          onToggle={() => toggle('why')}
        >
          <ul className="space-y-1">
            {fix.decisionTrace.rulePath.map((r, i) => (
              <li key={i} className="text-xs font-mono text-[#555] dark:text-[#9e9e98]">{r}</li>
            ))}
          </ul>
          {fix.decisionTrace.groupedBecause.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {fix.decisionTrace.groupedBecause.map((r, i) => (
                <p key={i} className="text-xs text-[#888] dark:text-[#666660]">{r}</p>
              ))}
            </div>
          )}
        </AccordionRow>

        <AccordionRow
          label={`Affected sources (${fix.affectedSourceCount})`}
          open={openSection === 'sources'}
          onToggle={() => toggle('sources')}
        >
          <ul className="space-y-1">
            {fix.affectedSources.map(s => (
              <li key={s.sourceId} className="text-xs font-mono text-[#555] dark:text-[#9e9e98]">
                {s.pageUrl
                  ? <a href={s.pageUrl} target="_blank" rel="noopener noreferrer" className="underline">{s.sourceTitle}</a>
                  : s.sourceTitle
                }
              </li>
            ))}
          </ul>
        </AccordionRow>

        <AccordionRow
          label="Verification checklist"
          open={openSection === 'checklist'}
          onToggle={() => toggle('checklist')}
        >
          <ul className="space-y-1.5">
            {fix.verificationChecklist.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-xs font-mono text-[#aaa] dark:text-[#444440] shrink-0 mt-0.5">☐</span>
                <span className="text-xs text-[#555] dark:text-[#9e9e98]">{item}</span>
              </li>
            ))}
          </ul>
        </AccordionRow>

        <AccordionRow
          label="Scope & audit trace"
          open={openSection === 'trace'}
          onToggle={() => toggle('trace')}
        >
          <div className="space-y-1.5">
            <p className="text-xs font-mono text-[#555] dark:text-[#9e9e98]">
              Scope: <strong>{fix.scope.likelihood}</strong>
              {' · '}
              {(fix.scope.confidence * 100).toFixed(0)}% extraction accuracy
            </p>
            {fix.decisionTrace.scopeReasons.map((r, i) => (
              <p key={i} className="text-xs text-[#888] dark:text-[#666660]">{r}</p>
            ))}
            <p className="text-xs font-mono text-[#aaa] dark:text-[#444440]">
              {fix.rawIssueCount} issues compressed into 1 fix · ratio {fix.compressionRatio}:1
            </p>
          </div>
        </AccordionRow>
      </div>
    </div>
  )
}

function AccordionRow({
  label, open, onToggle, children,
}: {
  label: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-[#e5e4df] dark:border-[#2c2c2a] last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-mono text-[#888] dark:text-[#666660] hover:text-[#111] dark:hover:text-[#ededea] transition-colors text-left"
      >
        <span>{label}</span>
        <span className="ml-2 select-none">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 pb-3">
          {children}
        </div>
      )}
    </div>
  )
}
