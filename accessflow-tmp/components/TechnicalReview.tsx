'use client'

import { useEffect, useRef, useState } from 'react'
import { TechnicalReview as TReview, TechnicalIssue, IssueSeverity } from '@/lib/types'
import { isExpertUnlocked, unlockExpert } from '@/lib/expert-gate'

const SEVERITY_STYLE: Record<IssueSeverity, string> = {
  Critical: 'border-[#111] dark:border-[#ededea] text-[#111] dark:text-[#ededea]',
  High: 'border-[#555] dark:border-[#9e9e98] text-[#555] dark:text-[#9e9e98]',
  Medium: 'border-[#888] dark:border-[#666660] text-[#888] dark:text-[#666660]',
  Low: 'border-[#ccc] dark:border-[#444440] text-[#aaa] dark:text-[#444440]',
}

type FixTab = 'quick' | 'technical' | 'owner'

function IssueRow({ issue }: { issue: TechnicalIssue }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<FixTab>('quick')

  return (
    <div className="border-b border-[#e5e4df] dark:border-[#2c2c2a] last:border-b-0">
      <button
        className="w-full text-left px-4 py-3 flex items-start justify-between gap-3 hover:bg-[#f7f6f0] dark:hover:bg-[#252523] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-mono px-1.5 py-0.5 border ${SEVERITY_STYLE[issue.severity]}`}>
              {issue.severity}
            </span>
            <span className="text-sm font-medium text-[#111] dark:text-[#ededea]">{issue.title}</span>
          </div>
          <p className="text-xs font-mono text-[#888] dark:text-[#666660] mt-1">{issue.wcag}</p>
          {issue.location && (
            <p className="text-xs font-mono text-[#aaa] dark:text-[#444440]">{issue.location}</p>
          )}
        </div>
        <span className="text-xs font-mono text-[#aaa] dark:text-[#444440] shrink-0 mt-0.5">{open ? 'â–²' : 'â–¼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-base text-[#333] dark:text-[#c8c8c2] leading-relaxed">{issue.problem}</p>

          {issue.detailedReason && (
            <div className="border-l-2 border-[#e5e4df] dark:border-[#2c2c2a] pl-3">
              <p className="text-xs font-mono uppercase tracking-wider text-[#aaa] dark:text-[#444440] mb-1">Why this fails</p>
              <p className="text-base text-[#555] dark:text-[#9e9e98] leading-relaxed">{issue.detailedReason}</p>
            </div>
          )}

          <div>
            <div className="flex gap-1 mb-3 border-b border-[#e5e4df] dark:border-[#2c2c2a]">
              {(['quick', 'technical', 'owner'] as FixTab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`text-xs font-mono uppercase tracking-wider px-3 py-2 transition-colors ${
                    tab === t
                      ? 'text-[#111] dark:text-[#ededea] border-b-2 border-[#111] dark:border-[#ededea] -mb-px'
                      : 'text-[#888] dark:text-[#666660] hover:text-[#111] dark:hover:text-[#ededea]'
                  }`}
                >
                  {t === 'quick' ? 'Quick fix' : t === 'technical' ? 'Technical fix' : 'Owner'}
                </button>
              ))}
            </div>

            {tab === 'quick' && (
              <p className="text-base text-[#333] dark:text-[#c8c8c2] leading-relaxed">{issue.quickFix}</p>
            )}

            {tab === 'technical' && (
              <div className="space-y-2">
                <p className="text-base text-[#333] dark:text-[#c8c8c2] leading-relaxed">{issue.technicalFix}</p>
                {issue.codeExample && (
                  <pre className="text-xs font-mono bg-[#F3F0E8] dark:bg-[#252523] border border-[#e5e4df] dark:border-[#2c2c2a] px-3 py-2 overflow-x-auto leading-relaxed whitespace-pre-wrap text-[#333] dark:text-[#c8c8c2]">
                    {issue.codeExample}
                  </pre>
                )}
              </div>
            )}

            {tab === 'owner' && (
              <div className="flex items-center gap-2">
                <span className="border border-[#111] dark:border-[#ededea] text-[#111] dark:text-[#ededea] text-sm font-mono px-3 py-1">
                  {issue.ownerSuggestion}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface TechnicalReviewProps {
  label: string
  contentType: 'url' | 'pdf'
  textSample: string
  wcagContext?: string
}

export function TechnicalReview({ label, contentType, textSample, wcagContext }: TechnicalReviewProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [review, setReview] = useState<TReview | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [showPasscode, setShowPasscode] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [passcodeError, setPasscodeError] = useState(false)
  const passcodeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setUnlocked(isExpertUnlocked())
  }, [])

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (unlockExpert(passcode)) {
      setUnlocked(true)
      setShowPasscode(false)
      setPasscode('')
      setPasscodeError(false)
    } else {
      setPasscodeError(true)
      setPasscode('')
      passcodeRef.current?.focus()
    }
  }

  async function runReview() {
    setState('loading')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/technical-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, contentType, textSample, wcagContext }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      const data: TReview = await res.json()
      setReview(data)
      setState('done')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Technical review failed')
      setState('error')
    }
  }

  if (state === 'idle') {
    return (
      <div className="border border-[#e5e4df] dark:border-[#2c2c2a] dark:bg-[#1c1c1a] px-4 sm:px-5 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660]">Technical Review</p>
            <p className="text-base text-[#555] dark:text-[#9e9e98] mt-1">
              WCAG issue list, severity, fix recommendations, and code examples.
              {!unlocked && <span className="font-mono text-[#aaa] dark:text-[#444440]"> · Expert access required.</span>}
            </p>
          </div>
          {unlocked ? (
            <button
              onClick={runReview}
              className="shrink-0 text-xs font-mono uppercase tracking-wider bg-[#111] dark:bg-[#ededea] text-white dark:text-[#111] px-4 py-2 hover:bg-[#333] dark:hover:bg-white transition-colors"
            >
              Open Technical Review
            </button>
          ) : (
            <button
              onClick={() => { setShowPasscode(true); setTimeout(() => passcodeRef.current?.focus(), 50) }}
              className="shrink-0 text-xs font-mono uppercase tracking-wider border border-[#e5e4df] dark:border-[#2c2c2a] text-[#888] dark:text-[#666660] px-4 py-2 hover:border-[#111] dark:hover:border-[#ededea] hover:text-[#111] dark:hover:text-[#ededea] transition-colors"
            >
              Unlock
            </button>
          )}
        </div>

        {showPasscode && !unlocked && (
          <form onSubmit={handleUnlock} className="mt-3 flex items-center gap-2">
            <input
              ref={passcodeRef}
              type="password"
              value={passcode}
              onChange={e => { setPasscode(e.target.value); setPasscodeError(false) }}
              placeholder="Access code"
              className={`text-sm font-mono border px-3 py-2 w-32 bg-white dark:bg-[#111110] text-[#111] dark:text-[#ededea] focus:outline-none transition-colors ${
                passcodeError
                  ? 'border-[#111] dark:border-[#ededea]'
                  : 'border-[#e5e4df] dark:border-[#2c2c2a] focus:border-[#111] dark:focus:border-[#ededea]'
              }`}
            />
            <button
              type="submit"
              className="text-xs font-mono uppercase tracking-wider bg-[#111] dark:bg-[#ededea] text-white dark:text-[#111] px-3 py-2 hover:bg-[#333] dark:hover:bg-white transition-colors"
            >
              Enter
            </button>
            {passcodeError && (
              <span className="text-xs font-mono text-[#888] dark:text-[#666660]">Incorrect code.</span>
            )}
          </form>
        )}
      </div>
    )
  }

  if (state === 'loading') {
    return (
      <div className="border border-[#e5e4df] dark:border-[#2c2c2a] dark:bg-[#1c1c1a] px-4 sm:px-5 py-4">
        <p className="text-sm font-mono text-[#888] dark:text-[#666660]">Running technical review...</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="border border-[#e5e4df] dark:border-[#2c2c2a] dark:bg-[#1c1c1a] px-4 sm:px-5 py-4">
        <p className="text-sm font-mono text-[#888] dark:text-[#666660]">Technical review failed: {errorMsg}</p>
        <button onClick={runReview} className="text-sm font-mono underline text-[#555] dark:text-[#9e9e98] mt-2">Retry</button>
      </div>
    )
  }

  if (!review) return null

  return (
    <div className="border border-[#e5e4df] dark:border-[#2c2c2a] dark:bg-[#1c1c1a] animate-fade-in">
      <div className="px-4 sm:px-5 py-4 border-b border-[#e5e4df] dark:border-[#2c2c2a] flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660] mb-1">
            Technical Review · {review.scanConfidence}% scan confidence
          </p>
          <p className="text-base text-[#333] dark:text-[#c8c8c2] leading-relaxed">{review.summary}</p>
        </div>
        <span className="text-xs font-mono border border-[#e5e4df] dark:border-[#2c2c2a] px-2 py-1 text-[#888] dark:text-[#666660] shrink-0">
          {review.issues.length} issue{review.issues.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div>
        {review.issues.map(issue => (
          <IssueRow key={issue.id} issue={issue} />
        ))}
      </div>
    </div>
  )
}
