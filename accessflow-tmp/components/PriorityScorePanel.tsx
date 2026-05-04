import { PriorityScore } from '@/lib/types'

const SCORE_ROWS: { key: keyof Omit<PriorityScore, 'total'>; label: string }[] = [
  { key: 'studentImpact', label: 'Student impact' },
  { key: 'legalRisk', label: 'Legal risk' },
  { key: 'usageFrequency', label: 'Usage frequency' },
  { key: 'contentReplaceability', label: 'Replaceability' },
  { key: 'timeSensitivity', label: 'Time sensitivity' },
]

interface PriorityScorePanelProps {
  score: PriorityScore
}

export function PriorityScorePanel({ score }: PriorityScorePanelProps) {
  return (
    <div className="px-4 sm:px-5 py-5 border-b border-[#e5e4df] dark:border-[#536878]">
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660]">Priority score</p>
        <p className="text-2xl font-bold text-[#111] dark:text-[#ededea] tracking-tight leading-none">
          {score.total}<span className="text-sm font-normal text-[#888] dark:text-[#666660]">/100</span>
        </p>
      </div>
      <div className="space-y-3">
        {SCORE_ROWS.map(({ key, label }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono text-[#555] dark:text-[#9e9e98]">{label}</span>
              <span className="text-xs font-mono text-[#888] dark:text-[#666660]">{score[key]}/10</span>
            </div>
            <div className="h-1 bg-[#EBE8E0] dark:bg-[#4d6373] w-full">
              <div
                className="h-1 bg-[#111] dark:bg-[#ededea] transition-all duration-500"
                style={{ width: `${score[key] * 10}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
