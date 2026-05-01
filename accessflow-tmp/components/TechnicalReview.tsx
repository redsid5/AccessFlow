'use client'

import { useEffect, useRef, useState } from 'react'
import { TechnicalReview as TReview, TechnicalIssue, IssueSeverity } from '@/lib/types'
import { isExpertUnlocked, unlockExpert } from '@/lib/expert-gate'

const SEVERITY_STYLE: Record<IssueSeverity, string> = {
  Critical: 'border-[#111] text-[#111]',
  High: 'border-[#555] text-[#555]',
  Medium: 'border-[#888] text-[#888]',
  Low: 'border-[#ccc] text-[#aaa]',
}

type FixTab = 'quick' | 'technical' | 'owner'

function IssueRow({ issue }: { issue: TechnicalIssue }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<FixTab>('quick')

  return (
    <div className="border-b border-[#e5e5e5] last:border-b-0">
      <button
        className="w-full text-left px-4 py-3 flex items-start justify-between gap-3 hover:bg-[#fafafa] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-mono px-1.5 py-0.5 border ${SEVERITY_STYLE[issue.severity]}`}>
              {issue.severity}
            </span>
            <span className="text-xs font-medium text-[#111]">{issue.title}</span>
          </div>
          <p className="text-[10px] font-mono text-[#888] mt-1">{issue.wcag}</p>
          {issue.location && (
            <p className="text-[10px] font-mono text-[#aaa]">{issue.location}</p>
          )}
        </div>
        <span className="text-[10px] font-mono text-[#aaa] shrink-0 mt-0.5">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-sm text-[#333] leading-relaxed">{issue.problem}</p>

          {issue.detailedReason && (
            <div className="border-l-2 border-[#e5e5e5] pl-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#aaa] mb-1">Why this fails</p>
              <p className="text-sm text-[#555] leading-relaxed">{issue.detailedReason}</p>
            </div>
          )}

          {/* Fix tabs */}
          <div>
            <div className="flex gap-1 mb-3 border-b border-[#e5e5e5]">
              {(['quick', 'technical', 'owner'] as FixTab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`text-[10px] font-mono uppercase tracking-wider px-3 py-2 transition-colors ${
                    tab === t
                      ? 'text-[#111] border-b-2 border-[#111] -mb-px'
                      : 'text-[#888] hover:text-[#111]'
                  }`}
                >
                  {t === 'quick' ? 'Quick fix' : t === 'technical' ? 'Technical fix' : 'Owner'}
                </button>
              ))}
            </div>

            {tab === 'quick' && (
              <p className="text-sm text-[#333] leading-relaxed">{issue.quickFix}</p>
            )}

            {tab === 'technical' && (
              <div className="space-y-2">
                <p className="text-sm text-[#333] leading-relaxed">{issue.technicalFix}</p>
                {issue.codeExample && (
                  <pre className="text-[10px] font-mono bg-[#f5f5f5] border border-[#e5e5e5] px-3 py-2 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                    {issue.codeExample}
                  </pre>
                )}
              </div>
            )}

            {tab === 'owner' && (
              <div className="flex items-center gap-2">
                <span className="border border-[#111] text-[#111] text-xs font-mono px-3 py-1">
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
      <div className="border border-[#e5e5e5] px-5 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-[#888]">Technical Review</p>
            <p className="text-sm text-[#555] mt-1">
              WCAG issue list, severity, fix recommendations, and code examples.
              {!unlocked && <span className="font-mono text-[#aaa]"> · Expert access required.</span>}
            </p>
          </div>
          {unlocked ? (
            <button
              onClick={runReview}
              className="shrink-0 text-[10px] font-mono uppercase tracking-wider bg-[#111] text-white px-4 py-2 hover:bg-[#333] transition-colors"
            >
              Open Technical Review
            </button>
          ) : (
            <button
              onClick={() => { setShowPasscode(true); setTimeout(() => passcodeRef.current?.focus(), 50) }}
              className="shrink-0 text-[10px] font-mono uppercase tracking-wider border border-[#e5e5e5] text-[#888] px-4 py-2 hover:border-[#111] hover:text-[#111] transition-colors"
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
              className={`text-xs font-mono border px-3 py-2 w-32 focus:outline-none focus:border-[#111] transition-colors ${
                passcodeError ? 'border-[#111]' : 'border-[#e5e5e5]'
              }`}
            />
            <button
              type="submit"
              className="text-[10px] font-mono uppercase tracking-wider bg-[#111] text-white px-3 py-2 hover:bg-[#333] transition-colors"
            >
              Enter
            </button>
            {passcodeError && (
              <span className="text-[10px] font-mono text-[#888]">Incorrect code.</span>
            )}
          </form>
        )}
      </div>
    )
  }

  if (state === 'loading') {
    return (
      <div className="border border-[#e5e5e5] px-5 py-4">
        <p className="text-xs font-mono text-[#888]">Running technical review...</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="border border-[#e5e5e5] px-5 py-4">
        <p className="text-xs font-mono text-[#888]">Technical review failed: {errorMsg}</p>
        <button onClick={runReview} className="text-[10px] font-mono underline text-[#555] mt-2">Retry</button>
      </div>
    )
  }

  if (!review) return null

  return (
    <div className="border border-[#e5e5e5] animate-fade-in">
      <div className="px-5 py-4 border-b border-[#e5e5e5] flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#888] mb-1">
            Technical Review · {review.scanConfidence}% scan confidence
          </p>
          <p className="text-sm text-[#333] leading-relaxed">{review.summary}</p>
        </div>
        <span className="text-[10px] font-mono border border-[#e5e5e5] px-2 py-1 text-[#888] shrink-0">
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
