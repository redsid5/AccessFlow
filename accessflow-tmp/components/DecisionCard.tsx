import { TriageResult } from '@/lib/types'

const DECISION_CONFIG = {
  fix: { label: 'Fix now', marker: '!' },
  review: { label: 'Needs review', marker: '?' },
  delete: { label: 'Delete / replace', marker: '×' },
} as const

interface DecisionCardProps {
  decision: TriageResult['decision']
  confidence: number
}

export function DecisionCard({ decision, confidence }: DecisionCardProps) {
  const { label, marker } = DECISION_CONFIG[decision]
  return (
    <div className="px-4 sm:px-5 py-5 border-b border-[#e5e4df] dark:border-[#2c2c2a]">
      <p className="text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660] mb-1">Decision</p>
      <p className="text-3xl sm:text-4xl font-bold text-[#111] dark:text-[#ededea] tracking-tight leading-none">
        <span className="font-mono mr-1.5">{marker}</span>{label}
      </p>
      <p className="text-xs font-mono text-[#888] dark:text-[#666660] mt-2">{confidence}% confidence</p>
    </div>
  )
}
