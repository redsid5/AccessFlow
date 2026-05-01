'use client'

import { DEMO_CASES } from '@/lib/demo-cases'
import { Role, TriageResult } from '@/lib/types'

interface DemoExamplesProps {
  onSelect: (label: string, result: TriageResult) => void
  role: Role
}

export function DemoExamples({ onSelect, role }: DemoExamplesProps) {
  return (
    <div className="mt-8">
      <p className="text-[10px] font-mono uppercase tracking-wider text-[#888] mb-3">
        Demo examples — no API key needed
      </p>
      <div className="space-y-2">
        {DEMO_CASES.map(demo => (
          <button
            key={demo.id}
            onClick={() => onSelect(demo.label, demo.result)}
            className="w-full text-left border border-[#e5e5e5] px-4 py-3 hover:border-[#111] transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-mono text-[#111] truncate group-hover:text-[#111]">
                  {demo.label}
                </p>
                <p className="text-[10px] text-[#888] mt-0.5">{demo.description}</p>
              </div>
              <span className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 border ${
                demo.result.decision === 'fix'
                  ? 'border-[#111] text-[#111]'
                  : demo.result.decision === 'delete'
                  ? 'border-[#888] text-[#888]'
                  : 'border-[#ccc] text-[#aaa]'
              }`}>
                {demo.result.decision === 'fix' ? 'Fix now' : demo.result.decision === 'delete' ? 'Delete' : 'Review'}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
