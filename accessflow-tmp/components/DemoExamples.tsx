'use client'

import { DEMO_CASES } from '@/lib/demo-cases'
import { DECISION_LABELS } from '@/lib/config'
import { Role, TriageResult } from '@/lib/types'

interface DemoExamplesProps {
  onSelect: (label: string, result: TriageResult) => void
  role: Role
}

export function DemoExamples({ onSelect, role }: DemoExamplesProps) {
  return (
    <div className="mt-8">
      <p className="text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660] mb-3">
        Demo examples — no API key needed
      </p>
      <div className="space-y-2">
        {DEMO_CASES.map(demo => (
          <button
            key={demo.id}
            onClick={() => onSelect(demo.label, demo.result)}
            className="w-full text-left border border-[#e5e4df] dark:border-[#2c2c2a] dark:bg-[#1c1c1a] px-4 py-3 hover:border-[#111] dark:hover:border-[#ededea] transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-mono text-[#111] dark:text-[#ededea] truncate">
                  {demo.label}
                </p>
                <p className="text-xs text-[#888] dark:text-[#666660] mt-0.5">{demo.description}</p>
              </div>
              <span className={`shrink-0 text-xs font-mono px-1.5 py-0.5 border ${
                demo.result.decision === 'fix'
                  ? 'border-[#111] dark:border-[#ededea] text-[#111] dark:text-[#ededea]'
                  : demo.result.decision === 'delete'
                  ? 'border-[#888] dark:border-[#666660] text-[#888] dark:text-[#666660]'
                  : 'border-[#ccc] dark:border-[#444440] text-[#aaa] dark:text-[#444440]'
              }`}>
                {DECISION_LABELS[demo.result.decision]}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
