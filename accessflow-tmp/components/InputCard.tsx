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
    <div className="border border-[#e5e4df] dark:border-[#2c2c2a] dark:bg-[#1c1c1a]">
      <div className="flex border-b border-[#e5e4df] dark:border-[#2c2c2a]">
        {(['url', 'pdf'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-mono uppercase tracking-wider transition-colors ${
              tab === t
                ? 'text-[#111] dark:text-[#ededea] border-b-2 border-[#111] dark:border-[#ededea] -mb-px'
                : 'text-[#888] dark:text-[#666660] hover:text-[#111] dark:hover:text-[#ededea]'
            }`}
          >
            {t === 'url' ? 'URL' : 'PDF'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-5">
        {tab === 'url' ? (
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660] mb-2">
              Page URL
            </label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://university.edu/financial-aid"
              className="w-full border border-[#e5e4df] dark:border-[#2c2c2a] bg-white dark:bg-[#111110] px-3 py-3 text-base text-[#111] dark:text-[#ededea] font-mono placeholder-[#ccc] dark:placeholder-[#444440] focus:outline-none focus:border-[#111] dark:focus:border-[#ededea] transition-colors"
              disabled={loading}
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660] mb-2">
              PDF file
            </label>
            <div
              className={`border border-dashed transition-colors cursor-pointer ${
                dragOver
                  ? 'border-[#111] dark:border-[#ededea] bg-[#F3F0E8] dark:bg-[#252523]'
                  : 'border-[#ccc] dark:border-[#2c2c2a] hover:border-[#999] dark:hover:border-[#444440]'
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
              <div className="px-4 py-7 text-center">
                {fileName ? (
                  <p className="text-base font-mono text-[#111] dark:text-[#ededea] truncate">{fileName}</p>
                ) : (
                  <>
                    <p className="text-base text-[#555] dark:text-[#9e9e98]">Drop a PDF here or click to browse</p>
                    <p className="text-xs font-mono text-[#aaa] dark:text-[#444440] mt-1">PDF files only</p>
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
          className="mt-4 w-full bg-[#111] dark:bg-[#ededea] text-white dark:text-[#111] text-sm font-mono uppercase tracking-wider py-3 disabled:opacity-30 hover:bg-[#333] dark:hover:bg-white transition-colors"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>
    </div>
  )
}
