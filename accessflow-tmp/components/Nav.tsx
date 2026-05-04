'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getQueue } from '@/lib/v2-queue'
import { STORAGE_KEYS } from '@/lib/config'

export function Nav() {
  const pathname = usePathname()
  const [queueCount, setQueueCount] = useState(0)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))

    function update() {
      const active = getQueue().filter(f =>
        ['NEW', 'ASSIGNED', 'IN_PROGRESS'].includes(f.status)
      ).length
      setQueueCount(active)
    }
    update()
    window.addEventListener('storage', update)
    window.addEventListener('accessflow:queue-updated', update)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('accessflow:queue-updated', update)
    }
  }, [])

  function toggleDark() {
    const isDark = document.documentElement.classList.toggle('dark')
    setDark(isDark)
    try { localStorage.setItem(STORAGE_KEYS.theme, isDark ? 'dark' : 'light') } catch {}
  }

  const links = [
    { href: '/', label: 'Analyze' },
    { href: '/queue', label: queueCount > 0 ? `Queue (${queueCount})` : 'Queue' },
  ]

  return (
    <nav className="border-b border-[#e5e4df] dark:border-[#2c2c2a] mb-8 sm:mb-10">
      <div className="max-w-[860px] mx-auto px-4 sm:px-5 flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                pathname === link.href
                  ? 'text-[#111] dark:text-[#ededea] border-b-2 border-[#111] dark:border-[#ededea] -mb-px'
                  : 'text-[#888] dark:text-[#666660] hover:text-[#111] dark:hover:text-[#ededea]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <button
          onClick={toggleDark}
          aria-label="Toggle dark mode"
          className="text-base text-[#888] dark:text-[#666660] hover:text-[#111] dark:hover:text-[#ededea] transition-colors px-2 py-3 leading-none"
        >
          {dark ? '☀' : '☾'}
        </button>
      </div>
    </nav>
  )
}
