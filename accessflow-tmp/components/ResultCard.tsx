'use client'

import { useState } from 'react'
import { TriageResult, Role } from '@/lib/types'
import { DecisionCard } from './DecisionCard'
import { PriorityScorePanel } from './PriorityScorePanel'
import { buildDecisionTrace } from '@/lib/scoring-config'

const PRIORITY_STYLE: Record<string, string> = {
  High: 'border-[#111] dark:border-[#ededea] text-[#111] dark:text-[#ededea]',
  Medium: 'border-[#888] dark:border-[#666660] text-[#888] dark:text-[#666660]',
  Low: 'border-[#ccc] dark:border-[#444440] text-[#aaa] dark:text-[#444440]',
}

const EFFORT_STYLE: Record<string, string> = {
  '10 min': 'border-[#111] dark:border-[#ededea] text-[#111] dark:text-[#ededea]',
  '2 hours': 'border-[#888] dark:border-[#666660] text-[#888] dark:text-[#666660]',
  'multi-team project': 'border-[#ccc] dark:border-[#444440] text-[#aaa] dark:text-[#444440]',
}

const USAGE_LABEL: Record<string, string> = {
  'high-traffic': 'High traffic',
  'seasonal': 'Seasonal',
  'archived': 'Archived',
  'unknown': 'Unknown traffic',
}

const SIGNALS = [
  { key: 'publicFacing', label: 'Public-facing' },
  { key: 'studentImpact', label: 'Student impact' },
  { key: 'betterAsHTML', label: 'Better as HTML' },
  { key: 'likelyLowValue', label: 'Likely low-value' },
  { key: 'timeSensitive', label: 'Time-sensitive' },
  { key: 'missionCritical', label: 'Mission-critical' },
] as const

function buildImpactLines(result: TriageResult): string[] {
  if (result.decision !== 'fix' || result.priority !== 'High') return []
  const lines: string[] = []
  if (result.signals.missionCritical)
    lines.push('Students cannot complete this process independently â€” it creates a direct barrier to a critical university service.')
  if (result.signals.timeSensitive)
    lines.push('This content has deadline pressure. An inaccessible page around a deadline means students miss it, not the page.')
  if (result.signals.studentImpact && !result.signals.missionCritical)
    lines.push('Students relying on assistive technology are blocked from accessing this content without help from another person.')
  if (result.signals.publicFacing && result.signals.missionCritical)
    lines.push('Public-facing mission-critical pages are the highest legal exposure under DOJ Title II â€” these are the first sites auditors check.')
  return lines
}

function buildDraftEmailHref(label: string, result: TriageResult): string {
  const subject = encodeURIComponent(`Accessibility triage: ${label}`)
  const body = encodeURIComponent(
    [
      `Content: ${label}`,
      `Decision: ${result.decision === 'fix' ? 'Fix now' : result.decision === 'delete' ? 'Delete / replace' : 'Needs review'}`,
      `Priority: ${result.priority}`,
      '',
      result.why,
      '',
      `Recommended action: ${result.action}`,
      `Suggested owner: ${result.owner}`,
      `Estimated effort: ${result.estimatedEffort}`,
    ].join('\n')
  )
  return `mailto:?subject=${subject}&body=${body}`
}

function buildExportText(label: string, result: TriageResult): string {
  return [
    'AccessFlow Triage Report',
    '========================',
    `Content: ${label}`,
    `Decision: ${result.decision}`,
    `Priority: ${result.priority}`,
    `Confidence: ${result.confidence}%`,
    '',
    `Why: ${result.why}`,
    `Action: ${result.action}`,
    `Owner: ${result.owner}`,
    `Effort: ${result.estimatedEffort}`,
    '',
    `Priority Score: ${result.priorityScore.total}/100`,
    `  Student impact: ${result.priorityScore.studentImpact}/10`,
    `  Legal risk: ${result.priorityScore.legalRisk}/10`,
    `  Usage frequency: ${result.priorityScore.usageFrequency}/10`,
    `  Replaceability: ${result.priorityScore.contentReplaceability}/10`,
    `  Time sensitivity: ${result.priorityScore.timeSensitivity}/10`,
    result.wcagContext ? `\nWCAG: ${result.wcagContext}` : '',
  ].filter(Boolean).join('\n')
}

interface ActionButtonProps {
  active: boolean
  onClick: () => void
  activeLabel: string
  inactiveLabel: string
}

function ActionButton({ active, onClick, activeLabel, inactiveLabel }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-mono uppercase tracking-wider px-3 py-2 border transition-colors ${
        active
          ? 'border-[#111] dark:border-[#ededea] bg-[#111] dark:bg-[#ededea] text-white dark:text-[#111]'
          : 'border-[#e5e4df] dark:border-[#536878] text-[#555] dark:text-[#9e9e98] hover:border-[#111] dark:hover:border-[#ededea]'
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </button>
  )
}

export function ResultCard({ result, label, role }: {
  result: TriageResult
  label: string
  role: Role
}) {
  const [copied, setCopied] = useState(false)
  const [resolved, setResolved] = useState(false)
  const [traceOpen, setTraceOpen] = useState(false)
  const trace = traceOpen ? buildDecisionTrace(result) : null

  function handleExport() {
    navigator.clipboard.writeText(buildExportText(label, result))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`border dark:bg-[#3a4d59] animate-fade-in transition-opacity border-[#e5e4df] dark:border-[#536878] ${resolved ? 'opacity-50' : ''}`}>

      {/* Header */}
      <div className="px-4 sm:px-5 py-4 border-b border-[#e5e4df] dark:border-[#536878]">
        <p className="text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660] mb-1">Analyzed content</p>
        <p className="font-semibold text-[#111] dark:text-[#ededea] text-base leading-snug break-all">{label}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className={`text-xs font-mono px-2 py-1 border ${PRIORITY_STYLE[result.priority]}`}>
            {result.priority} priority
          </span>
          <span className="text-xs font-mono px-2 py-1 border border-[#e5e4df] dark:border-[#536878] text-[#555] dark:text-[#9e9e98]">
            {result.contentDescription}
          </span>
          <span className={`text-xs font-mono px-2 py-1 border ${EFFORT_STYLE[result.estimatedEffort]}`}>
            {result.estimatedEffort}
          </span>
          <span className="text-xs font-mono px-2 py-1 border border-[#e5e4df] dark:border-[#536878] text-[#888] dark:text-[#666660]">
            {USAGE_LABEL[result.usageSignal]}
          </span>
        </div>
      </div>

      <DecisionCard decision={result.decision} confidence={result.confidence} />

      {result.confidence < 70 && (
        <div className="px-4 sm:px-5 py-3 border-b border-[#e5e4df] dark:border-[#536878] bg-[#F9F6EE] dark:bg-[#4d6373]">
          <p className="text-xs font-mono text-[#555] dark:text-[#9e9e98]">
            <span className="font-semibold text-[#111] dark:text-[#ededea]">Manual review required.</span>{' '}
            Extraction accuracy below threshold â€” signals may be incomplete or conflicting. Verify before acting.
          </p>
        </div>
      )}

      <PriorityScorePanel score={result.priorityScore} />

      {/* Body */}
      <div className="px-4 sm:px-5 py-5 space-y-5">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660] mb-1.5">Why this decision</p>
          <p className="text-base text-[#333] dark:text-[#c8c8c2] leading-relaxed">{result.why}</p>
        </div>

        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660] mb-1.5">Recommended action</p>
          <p className="text-base text-[#111] dark:text-[#ededea] font-medium leading-relaxed">{result.action}</p>
        </div>

        {(() => {
          const lines = buildImpactLines(result)
          return lines.length > 0 ? (
            <div className="border border-[#111] dark:border-[#ededea] px-4 py-3">
              <p className="text-xs font-mono uppercase tracking-wider text-[#111] dark:text-[#ededea] mb-2">Impact of inaction</p>
              <ul className="space-y-1.5">
                {lines.map((line, i) => (
                  <li key={i} className="text-sm text-[#333] dark:text-[#c8c8c2] leading-relaxed pl-3 border-l-2 border-[#e5e4df] dark:border-[#536878]">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ) : null
        })()}

        {result.roleNote && (
          <div className="border border-[#e5e4df] dark:border-[#536878] px-4 py-3">
            <p className="text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660] mb-1">For you specifically</p>
            <p className="text-base text-[#333] dark:text-[#c8c8c2]">{result.roleNote}</p>
          </div>
        )}

        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660] mb-1.5">Suggested owner</p>
          <span className="inline-block border border-[#111] dark:border-[#ededea] text-[#111] dark:text-[#ededea] text-sm font-mono px-3 py-1">
            {result.owner}
          </span>
        </div>

        {result.wcagContext && role === 'staff' && (
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660] mb-1.5">WCAG context</p>
            <p className="text-sm text-[#555] dark:text-[#9e9e98] font-mono leading-relaxed">{result.wcagContext}</p>
          </div>
        )}

        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660] mb-2">Triage signals</p>
          <div className="flex flex-wrap gap-1.5">
            {SIGNALS.map(s => {
              const active = result.signals[s.key]
              return (
                <span
                  key={s.key}
                  className={`text-xs font-mono px-2 py-1 border ${
                    active
                      ? 'border-[#111] dark:border-[#ededea] bg-[#111] dark:bg-[#ededea] text-white dark:text-[#111]'
                      : 'border-[#e5e4df] dark:border-[#536878] text-[#aaa] dark:text-[#444440]'
                  }`}
                >
                  {active ? '+ ' : ''}{s.label}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-5 py-4 border-t border-[#e5e4df] dark:border-[#536878] flex flex-wrap gap-2">
        <ActionButton active={copied} onClick={handleExport} activeLabel="Copied" inactiveLabel="Export report" />
        <ActionButton active={resolved} onClick={() => setResolved(r => !r)} activeLabel="Resolved" inactiveLabel="Mark resolved" />
        <a
          href={buildDraftEmailHref(label, result)}
          className="text-xs font-mono uppercase tracking-wider px-3 py-2 border border-[#e5e4df] dark:border-[#536878] text-[#555] dark:text-[#9e9e98] hover:border-[#111] dark:hover:border-[#ededea] transition-colors"
        >
          Draft email
        </a>
        <button
          onClick={() => setTraceOpen(o => !o)}
          className="text-xs font-mono uppercase tracking-wider px-3 py-2 border border-[#e5e4df] dark:border-[#536878] text-[#555] dark:text-[#9e9e98] hover:border-[#111] dark:hover:border-[#ededea] transition-colors"
        >
          {traceOpen ? 'Hide audit' : 'Decision audit'}
        </button>
      </div>

      {traceOpen && trace && (
        <div className="border-t border-[#e5e4df] dark:border-[#536878] px-4 sm:px-5 py-4 dark:bg-[#425561]">
          <p className="text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660] mb-3">Decision trace</p>
          <div className="space-y-3 text-xs font-mono">
            <div>
              <span className="text-[#aaa] dark:text-[#444440]">rule </span>
              <span className="text-[#333] dark:text-[#c8c8c2]">{trace.rule}</span>
            </div>
            <div>
              <span className="text-[#aaa] dark:text-[#444440]">active signals </span>
              <span className="text-[#333] dark:text-[#c8c8c2]">{trace.activeSignals.join(', ') || 'none'}</span>
            </div>
            <div>
              <p className="text-[#aaa] dark:text-[#444440] mb-1.5">score breakdown</p>
              <div className="space-y-1 pl-2 border-l border-[#e5e4df] dark:border-[#536878]">
                {trace.scoreBreakdown.map(d => (
                  <div key={d.dimension} className="flex gap-3">
                    <span className="text-[#aaa] dark:text-[#444440] w-36 shrink-0">{d.dimension}</span>
                    <span className="text-[#555] dark:text-[#9e9e98]">{d.score}/10 Ã— {d.weight} = {d.weighted}</span>
                  </div>
                ))}
                <div className="flex gap-3 pt-1 border-t border-[#e5e4df] dark:border-[#536878]">
                  <span className="text-[#aaa] dark:text-[#444440] w-36 shrink-0">normalized total</span>
                  <span className="text-[#111] dark:text-[#ededea]">{trace.normalizedScore}/100 â†’ {trace.priorityBand}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 sm:px-5 py-3 border-t border-[#e5e4df] dark:border-[#536878]">
        <p className="text-xs text-[#aaa] dark:text-[#444440] font-mono">
          Supports prioritization. Does not replace a full audit or legal review.
        </p>
      </div>
    </div>
  )
}
