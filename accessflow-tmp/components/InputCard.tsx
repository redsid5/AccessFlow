'use client'

import { useRef, useState } from 'react'

type Tab = 'url' | 'pdf'

interface InputCardProps {
  onSubmitURL: (url: string) => void
  onSubmitPDF: (file: File) => void
  loading: boolean
}

export function InputCard({ onSubmitURL, onSubmitPDF, loading }: InputCardProps) {
  const [tab, setTab] = useState<Tab>('url')
  const [url, setUrl] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const fileObj = useRef<File | null>(null)

  function handleFileChange(file: File) {
    fileObj.current = file
    setFileName(file.name)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (tab === 'url' && url.trim()) {
      onSubmitURL(url.trim())
    } else if (tab === 'pdf' && fileObj.current) {
      onSubmitPDF(fileObj.current)
    }
  }

  return (
    <div className="border border-[#e5e5e5]">
      {/* Tab bar */}
      <div className="flex border-b border-[#e5e5e5]">
        {(['url', 'pdf'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
              tab === t
                ? 'text-[#111] border-b-2 border-[#111] -mb-px'
                : 'text-[#888] hover:text-[#111]'
            }`}
          >
            {t === 'url' ? 'URL' : 'PDF'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-5">
        {tab === 'url' ? (
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-[#888] mb-2">
              Page URL
            </label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://university.edu/financial-aid"
              className="w-full border border-[#e5e5e5] px-3 py-2.5 text-sm text-[#111] font-mono placeholder-[#ccc] focus:outline-none focus:border-[#111] transition-colors"
              disabled={loading}
            />
          </div>
        ) : (
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-[#888] mb-2">
              PDF file
            </label>
            <div
              className={`border border-dashed transition-colors cursor-pointer ${
                dragOver ? 'border-[#111] bg-[#f5f5f5]' : 'border-[#ccc]'
              }`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault()
                setDragOver(false)
                const file = e.dataTransfer.files[0]
                if (file?.type === 'application/pdf') handleFileChange(file)
              }}
            >
              <div className="px-4 py-6 text-center">
                {fileName ? (
                  <p className="text-sm font-mono text-[#111] truncate">{fileName}</p>
                ) : (
                  <>
                    <p className="text-sm text-[#555]">Drop a PDF here or click to browse</p>
                    <p className="text-[10px] font-mono text-[#aaa] mt-1">PDF files only</p>
                  </>
                )}
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleFileChange(file)
              }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (tab === 'url' ? !url.trim() : !fileName)}
          className="mt-4 w-full bg-[#111] text-white text-xs font-mono uppercase tracking-wider py-3 disabled:opacity-30 hover:bg-[#333] transition-colors"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>
    </div>
  )
}
