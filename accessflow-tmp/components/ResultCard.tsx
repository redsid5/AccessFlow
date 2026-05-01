'use client'

import { useState } from 'react'
import { TriageResult, Role, PriorityScore } from '@/lib/types'

const DECISION_CONFIG = {
  fix: { label: 'Fix now', marker: '!' },
  review: { label: 'Needs review', marker: '?' },
  delete: { label: 'Delete / replace', marker: '×' },
}

const PRIORITY_STYLE = {
  High: 'border-[#111] text-[#111]',
  Medium: 'border-[#888] text-[#888]',
  Low: 'border-[#ccc] text-[#aaa]',
}

const EFFORT_STYLE = {
  '10 min': 'border-[#111] text-[#111]',
  '2 hours': 'border-[#888] text-[#888]',
  'multi-team project': 'border-[#ccc] text-[#aaa]',
}

const USAGE_LABEL = {
  'high-traffic': 'High traffic',
  'seasonal': 'Seasonal',
  'archived': 'Archived',
  'unknown': 'Unknown traffic',
}

const SCORE_LABELS: { key: keyof Omit<PriorityScore, 'total'>; label: string }[] = [
  { key: 'studentImpact', label: 'Student impact' },
  { key: 'legalRisk', label: 'Legal risk' },
  { key: 'usageFrequency', label: 'Usage frequency' },
  { key: 'contentReplaceability', label: 'Replaceability' },
  { key: 'timeSensitivity', label: 'Time sensitivity' },
]

const SIGNALS = [
  { key: 'publicFacing', label: 'Public-facing' },
  { key: 'studentImpact', label: 'Student impact' },
  { key: 'betterAsHTML', label: 'Better as HTML' },
  { key: 'likelyLowValue', label: 'Likely low-value' },
  { key: 'timeSensitive', label: 'Time-sensitive' },
  { key: 'missionCritical', label: 'Mission-critical' },
]

export function ResultCard({ result, label, role }: {
  result: TriageResult
  label: string
  role: Role
}) {
  const config = DECISION_CONFIG[result.decision]
  const [copied, setCopied] = useState(false)
  const [assigned, setAssigned] = useState(false)
  const [resolved, setResolved] = useState(false)

  function handleExport() {
    const text = [
      `AccessFlow Triage Report`,
      `========================`,
      `Content: ${label}`,
      `Decision: ${config.label}`,
      `Priority: ${result.priority}`,
      `Confidence: ${result.confidence}%`,
      ``,
      `Why: ${result.why}`,
      `Action: ${result.action}`,
      `Owner: ${result.owner}`,
      `Effort: ${result.estimatedEffort}`,
      `Usage: ${USAGE_LABEL[result.usageSignal]}`,
      ``,
      `Priority Score: ${result.priorityScore.total}/100`,
      `  Student impact: ${result.priorityScore.studentImpact}/10`,
      `  Legal risk: ${result.priorityScore.legalRisk}/10`,
      `  Usage frequency: ${result.priorityScore.usageFrequency}/10`,
      `  Replaceability: ${result.priorityScore.contentReplaceability}/10`,
      `  Time sensitivity: ${result.priorityScore.timeSensitivity}/10`,
      result.wcagContext ? `\nWCAG: ${result.wcagContext}` : '',
    ].filter(Boolean).join('\n')

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`border bg-white animate-fade-in transition-opacity ${resolved ? 'opacity-50' : 'border-[#e5e5e5]'}`}>

      {/* Header */}
      <div className="px-5 py-4 border-b border-[#e5e5e5]">
        <p className="text-[10px] font-mono uppercase tracking-wider text-[#888] mb-1">Analyzed content</p>
        <p className="font-semibold text-[#111] text-sm leading-snug break-all">{label}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className={`text-[10px] font-mono px-2 py-1 border ${PRIORITY_STYLE[result.priority]}`}>
            {result.priority} priority
          </span>
          <span className="text-[10px] font-mono px-2 py-1 border border-[#e5e5e5] text-[#555]">
            {result.contentDescription}
          </span>
          <span className={`text-[10px] font-mono px-2 py-1 border ${EFFORT_STYLE[result.estimatedEffort]}`}>
            {result.estimatedEffort}
          </span>
          <span className="text-[10px] font-mono px-2 py-1 border border-[#e5e5e5] text-[#888]">
            {USAGE_LABEL[result.usageSignal]}
          </span>
        </div>
      </div>

      {/* Decision */}
      <div className="px-5 py-5 border-b border-[#e5e5e5]">
        <p className="text-[10px] font-mono uppercase tracking-wider text-[#888] mb-1">Decision</p>
        <p className="text-3xl font-bold text-[#111] tracking-tight leading-none">
          <span className="font-mono mr-1.5">{config.marker}</span>{config.label}
        </p>
        <p className="text-[10px] font-mono text-[#888] mt-2">{result.confidence}% confidence</p>
      </div>

      {/* Priority Score */}
      <div className="px-5 py-5 border-b border-[#e5e5e5]">
        <div className="flex items-baseline justify-between mb-4">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#888]">Priority score</p>
          <p className="text-2xl font-bold text-[#111] tracking-tight leading-none">
            {result.priorityScore.total}<span className="text-sm font-normal text-[#888]">/100</span>
          </p>
        </div>
        <div className="space-y-3">
          {SCORE_LABELS.map(({ key, label: scoreLabel }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-[#555]">{scoreLabel}</span>
                <span className="text-[10px] font-mono text-[#888]">{result.priorityScore[key]}/10</span>
              </div>
              <div className="h-1 bg-[#f0f0f0] w-full">
                <div
                  className="h-1 bg-[#111] transition-all duration-500"
                  style={{ width: `${result.priorityScore[key] * 10}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-5">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#888] mb-1.5">Why this decision</p>
          <p className="text-sm text-[#333] leading-relaxed">{result.why}</p>
        </div>

        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#888] mb-1.5">Recommended action</p>
          <p className="text-sm text-[#111] font-medium leading-relaxed">{result.action}</p>
        </div>

        {result.roleNote && (
          <div className="border border-[#e5e5e5] px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#888] mb-1">For you specifically</p>
            <p className="text-sm text-[#333]">{result.roleNote}</p>
          </div>
        )}

        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#888] mb-1.5">Suggested owner</p>
          <span className="inline-block border border-[#111] text-[#111] text-xs font-mono px-3 py-1">
            {result.owner}
          </span>
        </div>

        {result.wcagContext && role === 'staff' && (
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#888] mb-1.5">WCAG context</p>
            <p className="text-xs text-[#555] font-mono leading-relaxed">{result.wcagContext}</p>
          </div>
        )}

        {/* Signals */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#888] mb-2">Reasoning signals</p>
          <div className="flex flex-wrap gap-1.5">
            {SIGNALS.map(s => {
              const active = result.signals[s.key as keyof typeof result.signals]
              return (
                <span
                  key={s.key}
                  className={`text-[10px] font-mono px-2 py-1 border ${
                    active ? 'border-[#111] bg-[#111] text-white' : 'border-[#e5e5e5] text-[#aaa]'
                  }`}
                >
                  {active ? '+ ' : ''}{s.label}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-5 py-4 border-t border-[#e5e5e5] flex flex-wrap gap-2">
        <button
          onClick={() => { setAssigned(true); setTimeout(() => setAssigned(false), 2000) }}
          className={`text-[10px] font-mono uppercase tracking-wider px-3 py-2 border transition-colors ${
            assigned ? 'border-[#111] bg-[#111] text-white' : 'border-[#e5e5e5] text-[#555] hover:border-[#111]'
          }`}
        >
          {assigned ? 'Assigned' : 'Assign owner'}
        </button>
        <button
          onClick={handleExport}
          className={`text-[10px] font-mono uppercase tracking-wider px-3 py-2 border transition-colors ${
            copied ? 'border-[#111] bg-[#111] text-white' : 'border-[#e5e5e5] text-[#555] hover:border-[#111]'
          }`}
        >
          {copied ? 'Copied' : 'Export report'}
        </button>
        <button
          onClick={() => setResolved(r => !r)}
          className={`text-[10px] font-mono uppercase tracking-wider px-3 py-2 border transition-colors ${
            resolved ? 'border-[#111] bg-[#111] text-white' : 'border-[#e5e5e5] text-[#555] hover:border-[#111]'
          }`}
        >
          {resolved ? 'Resolved' : 'Mark resolved'}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="px-5 py-3 border-t border-[#e5e5e5]">
        <p className="text-[10px] text-[#aaa] font-mono">
          Supports prioritization. Does not replace a full audit or legal review.
        </p>
      </div>
    </div>
  )
}
