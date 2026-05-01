export function Header() {
  return (
    <header className="mb-8 sm:mb-10">
      <div className="flex items-center gap-3 mb-4">
        <span className="font-mono text-xs bg-[#111] dark:bg-[#ededea] text-white dark:text-[#111] px-2 py-1 tracking-wide">
          AccessFlow
        </span>
        <span className="text-sm text-[#888] dark:text-[#666660] font-mono">30-second triage</span>
      </div>

      <h1 className="text-2xl sm:text-[1.875rem] font-bold text-[#111] dark:text-[#ededea] leading-tight tracking-tight">
        Access Decision Assistant
        <span className="block text-[#888] dark:text-[#666660] font-normal text-xl sm:text-2xl mt-1">
          Not a scanner. A decision layer.
        </span>
      </h1>

      <p className="mt-3 text-base text-[#555] dark:text-[#9e9e98] leading-relaxed max-w-lg">
        Paste a URL or upload a PDF. Get one clear decision — fix it, review it, or remove it.
        Designed for campus staff with no WCAG expertise required.
      </p>

      <div className="mt-5 inline-flex items-center gap-2 bg-[#111] dark:bg-[#1c1c1a] dark:border dark:border-[#2c2c2a] px-4 py-2.5 font-mono text-sm flex-wrap">
        <span className="text-[#666] dark:text-[#555550]">Triage order:</span>
        <span className="text-white dark:text-[#ededea] font-medium">1. Remove</span>
        <span className="text-[#444] dark:text-[#444440]">→</span>
        <span className="text-white dark:text-[#ededea] font-medium">2. Replace</span>
        <span className="text-[#444] dark:text-[#444440]">→</span>
        <span className="text-white dark:text-[#ededea] font-medium">3. Remediate</span>
      </div>
    </header>
  )
}
