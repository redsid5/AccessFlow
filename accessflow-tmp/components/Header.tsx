export function Header() {
  return (
    <header className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <span className="font-mono text-xs bg-black text-white px-2 py-1 tracking-wide">
          AccessFlow
        </span>
        <span className="text-xs text-[#888] font-mono">30-second triage</span>
      </div>

      <h1 className="text-[1.75rem] font-bold text-[#111] leading-tight tracking-tight">
        Access Decision Assistant
        <span className="block text-[#888] font-normal text-xl mt-0.5">Not a scanner. A decision layer.</span>
      </h1>

      <p className="mt-3 text-sm text-[#555] leading-relaxed max-w-lg">
        Paste a URL or upload a PDF. Get one clear decision — fix it, review it, or remove it.
        Designed for campus staff with no WCAG expertise required.
      </p>

      <div className="mt-5 inline-flex items-center gap-2 bg-[#111] text-[#aaa] px-4 py-2.5 font-mono text-xs flex-wrap">
        <span className="text-[#555]">Triage order:</span>
        <span className="text-white font-medium">1. Remove</span>
        <span className="text-[#444]">→</span>
        <span className="text-white font-medium">2. Replace</span>
        <span className="text-[#444]">→</span>
        <span className="text-white font-medium">3. Remediate</span>
      </div>
    </header>
  )
}
