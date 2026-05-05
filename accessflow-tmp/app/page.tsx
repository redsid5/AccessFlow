'use client'

import { useState, useRef } from 'react'
import { AnalysisV2Result, FixOpportunity } from '@/lib/v2-types'
import { addFixOpportunities } from '@/lib/v2-queue'
import { getSortScore } from '@/lib/v2-display'
import { FixCard } from '@/components/v2/FixCard'

type InputTab = 'url' | 'pdf'

export default function Home() {
  const [tab, setTab] = useState<InputTab>('url')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisV2Result | null>(null)
  const [queued, setQueued] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function analyze() {
    setLoading(true)
    setError(null)
    setResult(null)
    setQueued(false)

    try {
      let body: Record<string, string>

      if (tab === 'url') {
        if (!url.startsWith('http')) {
          setError('Enter a full URL starting with http:// or https://')
          return
        }
        body = { url }
      } else {
        if (!file) {
          setError('Select a PDF file first')
          return
        }
        const text = await readFileAsText(file)
        body = { pdfText: text, sourceTitle: file.name, sourceId: file.name }
      }

      const res = await fetch('/api/v2/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Analysis failed')
      }

      const data: AnalysisV2Result = await res.json()
      setResult(data)

      if (data.fixOpportunities.length > 0) {
        addFixOpportunities(data.fixOpportunities)
        window.dispatchEvent(new Event('accessflow:queue-updated'))
        setQueued(true)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-4 sm:px-5 pb-20">
      <div className="max-w-[720px] mx-auto">

        <div className="pt-10 pb-7">
          <h1 className="text-2xl font-semibold text-[#111] dark:text-[#ededea] tracking-tight">
            AccessFlow
          </h1>
          <p className="text-sm text-[#888] dark:text-[#666660] mt-1">
            Fix once. Clear many. Less repeated work.
          </p>
          <p className="text-xs font-mono text-[#aaa] dark:text-[#444440] mt-2 leading-relaxed max-w-lg">
            Paste a URL or PDF — we detect repeated accessibility patterns and consolidate them into fewer, higher-value fixes.
          </p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs font-mono text-[#ccc] dark:text-[#333330]">Pattern-based, not just a scanner</span>
            <span className="text-xs font-mono text-[#e5e4df] dark:text-[#2c2c2a]">·</span>
            <span className="text-xs font-mono text-[#ccc] dark:text-[#333330]">~2 min per page</span>
            <span className="text-xs font-mono text-[#e5e4df] dark:text-[#2c2c2a]">·</span>
            <span className="text-xs font-mono text-[#ccc] dark:text-[#333330]">built for university digital offices</span>
          </div>
        </div>

        <p className="text-xs font-mono uppercase tracking-wider text-[#aaa] dark:text-[#444440] mb-3">
          Paste a university webpage URL or upload an accessibility PDF
        </p>

        {/* Input tabs */}
        <div className="flex gap-0 mb-4">
          {(['url', 'pdf'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null) }}
              className={`text-xs font-mono px-4 py-2.5 border transition-colors ${
                tab === t
                  ? 'border-[#111] dark:border-[#ededea] bg-[#111] dark:bg-[#ededea] text-white dark:text-[#111]'
                  : 'border-[#e5e4df] dark:border-[#2c2c2a] text-[#888] dark:text-[#666660] hover:border-[#111] dark:hover:border-[#ededea] -ml-px'
              }`}
            >
              {t === 'url' ? 'URL' : 'PDF'}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="border border-[#e5e4df] dark:border-[#2c2c2a] dark:bg-[#1c1c1a] p-4 sm:p-5">
          {tab === 'url' ? (
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && analyze()}
              placeholder="https://university.edu/page"
              className="w-full text-sm font-mono bg-transparent text-[#111] dark:text-[#ededea] placeholder-[#ccc] dark:placeholder-[#444440] focus:outline-none"
            />
          ) : (
            <div>
              <button
                onClick={() => fileRef.current?.click()}
                className="text-sm font-mono text-[#555] dark:text-[#9e9e98] hover:text-[#111] dark:hover:text-[#ededea] transition-colors"
              >
                {file ? file.name : 'Click to select a PDF â†’'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          )}
        </div>

        <button
          onClick={analyze}
          disabled={loading}
          className="mt-3 w-full text-sm font-mono bg-[#111] dark:bg-[#ededea] text-white dark:text-[#111] py-3 px-4 disabled:opacity-40 hover:bg-[#333] dark:hover:bg-white transition-colors"
        >
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>

        {!result && !loading && <SamplePanel />}

        {error && (
          <div className="mt-5 border border-[#e5e4df] dark:border-[#2c2c2a] dark:bg-[#1c1c1a] px-4 py-3">
            <p className="text-xs font-mono text-[#888] dark:text-[#666660]">Error</p>
            <p className="text-sm text-[#111] dark:text-[#ededea] mt-1">{error}</p>
          </div>
        )}

        {result && !loading && (
          <div className="mt-8">
            <SummaryBar result={result} queued={queued} />
            <div className="mt-4 space-y-px">
              {result.fixOpportunities.length === 0 ? (
                <div className="border border-[#e5e4df] dark:border-[#2c2c2a] dark:bg-[#1c1c1a] px-5 py-8 text-center">
                  <p className="text-sm font-mono text-[#888] dark:text-[#666660]">
                    No accessibility issues detected.
                  </p>
                </div>
              ) : (
                [...result.fixOpportunities]
                  .sort((a, b) => getSortScore(b) - getSortScore(a))
                  .map(fix => (
                    <FixCard key={fix.id} fix={fix} />
                  ))
              )}
            </div>
          </div>
        )}

        <footer className="mt-16 pt-8 border-t border-[#e5e4df] dark:border-[#2c2c2a]">
          <p className="text-xs font-mono text-[#aaa] dark:text-[#444440]">
            AccessFlow â€” accessibility backlog compression for university digital offices
          </p>
        </footer>
      </div>
    </main>
  )
}

function SamplePanel() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-8">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs font-mono text-[#aaa] dark:text-[#444440] hover:text-[#555] dark:hover:text-[#9e9e98] transition-colors"
      >
        {open ? '↑ hide example' : '↓ see example output'}
      </button>
      {open && (
        <div className="mt-3 border border-[#e5e4df] dark:border-[#2c2c2a] dark:bg-[#1c1c1a] animate-fade-in">
          <div className="px-4 py-4 border-b border-[#e5e4df] dark:border-[#2c2c2a]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono px-2 py-0.5 bg-[#111] dark:bg-[#ededea] text-white dark:text-[#111]">FIX</span>
              <span className="text-xs font-mono text-[#888] dark:text-[#666660]">High leverage · quick fix · 4 pages</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#111] dark:text-[#ededea]">Unlabeled form inputs</p>
            <p className="mt-1 text-xs font-mono text-[#555] dark:text-[#9e9e98]">~1h saved — shared component, fix once, clears 4 instances</p>
          </div>
          <div className="px-4 py-3 border-b border-[#e5e4df] dark:border-[#2c2c2a]">
            <p className="text-xs font-mono uppercase tracking-wider text-[#aaa] dark:text-[#444440] mb-1">Next step</p>
            <p className="text-sm text-[#333] dark:text-[#c8c8c2]">Add <code className="font-mono text-xs bg-[#f0ede6] dark:bg-[#252523] px-1">aria-label</code> or <code className="font-mono text-xs bg-[#f0ede6] dark:bg-[#252523] px-1">&lt;label for&gt;</code> to each input in the shared form component.</p>
          </div>
          <div className="px-4 py-3 border-b border-[#e5e4df] dark:border-[#2c2c2a]">
            <p className="text-xs font-mono uppercase tracking-wider text-[#aaa] dark:text-[#444440] mb-1">Pages affected</p>
            <p className="text-xs font-mono text-[#555] dark:text-[#9e9e98]">contact.html · admissions/apply · registrar/forms · housing/request</p>
          </div>
          <div className="px-4 py-2.5">
            <p className="text-xs font-mono text-[#ccc] dark:text-[#333330]">Example output — analyze a real page to see your results</p>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryBar({ result, queued }: { result: AnalysisV2Result; queued: boolean }) {
  const ratio = result.compressionRatio
  return (
    <div className="border-t border-b border-[#e5e4df] dark:border-[#2c2c2a] py-3 flex items-center gap-2 flex-wrap">
      <span className="text-xs font-mono text-[#888] dark:text-[#666660]">
        {result.rawIssues.length} issues found
      </span>
      <span className="text-xs font-mono text-[#ccc] dark:text-[#333330]">Â·</span>
      <span className="text-xs font-mono text-[#888] dark:text-[#666660]">
        {result.fixOpportunities.length} fix{result.fixOpportunities.length !== 1 ? 'es' : ''} needed
      </span>
      <span className="text-xs font-mono text-[#ccc] dark:text-[#333330]">Â·</span>
      <span className="text-xs font-mono text-[#111] dark:text-[#ededea] font-semibold">
        {ratio.toFixed(1)}Ã— less work
      </span>
      {queued && (
        <>
          <span className="text-xs font-mono text-[#ccc] dark:text-[#333330]">Â·</span>
          <a href="/queue" className="text-xs font-mono text-[#555] dark:text-[#9e9e98] underline">
            added to queue
          </a>
        </>
      )}
    </div>
  )
}

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsText(file)
  })
}
