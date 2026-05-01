'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { RoleSelector } from '@/components/RoleSelector'
import { InputCard } from '@/components/InputCard'
import { ResultCard } from '@/components/ResultCard'
import { DemoExamples } from '@/components/DemoExamples'
import { TechnicalReview } from '@/components/TechnicalReview'
import { Role, TriageResult, ContentType } from '@/lib/types'
import { addToQueue } from '@/lib/queue-store'

interface ResultState {
  label: string
  type: ContentType
  result: TriageResult
  textSample?: string
}

export default function Home() {
  const [role, setRole] = useState<Role>('staff')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultState, setResultState] = useState<ResultState | null>(null)
  const [addedToQueue, setAddedToQueue] = useState(false)

  function queueResult(label: string, type: ContentType, result: TriageResult) {
    addToQueue(label, type, role, result)
    window.dispatchEvent(new Event('accessflow:queue-updated'))
    setAddedToQueue(true)
    setTimeout(() => setAddedToQueue(false), 3000)
  }

  async function handleURL(url: string) {
    setLoading(true)
    setError(null)
    setResultState(null)
    setAddedToQueue(false)
    try {
      const res = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, role }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Analysis failed')
      const result: TriageResult = await res.json()
      setResultState({ label: url, type: 'url', result, textSample: url })
      queueResult(url, 'url', result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handlePDF(file: File) {
    setLoading(true)
    setError(null)
    setResultState(null)
    setAddedToQueue(false)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('role', role)
      const res = await fetch('/api/analyze-pdf', {
        method: 'POST',
        body: form,
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Analysis failed')
      const result: TriageResult = await res.json()
      setResultState({ label: file.name, type: 'pdf', result, textSample: file.name })
      queueResult(file.name, 'pdf', result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleDemo(label: string, result: TriageResult) {
    setError(null)
    setResultState({ label, type: 'pdf', result })
  }

  return (
    <main className="min-h-screen px-5 pb-16">
      <div className="max-w-[680px] mx-auto">
        <Header />
        <RoleSelector value={role} onChange={setRole} />
        <InputCard onSubmitURL={handleURL} onSubmitPDF={handlePDF} loading={loading} />

        {loading && (
          <p className="mt-6 text-sm font-mono text-[#888]">Analyzing...</p>
        )}

        {error && (
          <div className="mt-6 border border-[#e5e5e5] px-4 py-3">
            <p className="text-xs font-mono text-[#888]">Error</p>
            <p className="text-sm text-[#111] mt-1">{error}</p>
          </div>
        )}

        {resultState && !loading && (
          <div className="mt-8">
            {addedToQueue && (
              <p className="text-[10px] font-mono text-[#888] mb-3">
                Added to queue →{' '}
                <a href="/queue" className="underline text-[#111]">view queue</a>
              </p>
            )}
            <ResultCard result={resultState.result} label={resultState.label} role={role} />
            {role === 'staff' && resultState.textSample && (
              <div className="mt-4">
                <TechnicalReview
                  label={resultState.label}
                  contentType={resultState.type}
                  textSample={resultState.textSample}
                  wcagContext={resultState.result.wcagContext}
                />
              </div>
            )}
          </div>
        )}

        <DemoExamples onSelect={handleDemo} role={role} />

        <footer className="mt-16 pt-8 border-t border-[#e5e5e5]">
          <p className="text-[10px] font-mono text-[#aaa]">
            AccessFlow — accessibility triage for university digital offices
          </p>
        </footer>
      </div>
    </main>
  )
}
