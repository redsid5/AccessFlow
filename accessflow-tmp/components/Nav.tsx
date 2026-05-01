'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getQueue } from '@/lib/queue-store'

export function Nav() {
  const pathname = usePathname()
  const [queueCount, setQueueCount] = useState(0)

  useEffect(() => {
    function update() {
      const items = getQueue()
      setQueueCount(items.filter(i => i.status === 'new' || i.status === 'assigned' || i.status === 'in-progress').length)
    }
    update()
    window.addEventListener('storage', update)
    window.addEventListener('accessflow:queue-updated', update)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('accessflow:queue-updated', update)
    }
  }, [])

  const links = [
    { href: '/', label: 'Analyze' },
    { href: '/queue', label: queueCount > 0 ? `Queue (${queueCount})` : 'Queue' },
    { href: '/dashboard', label: 'Dashboard' },
  ]

  return (
    <nav className="border-b border-[#e5e5e5] mb-10">
      <div className="max-w-[680px] mx-auto px-5 flex items-center gap-1">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
              pathname === link.href
                ? 'text-[#111] border-b-2 border-[#111] -mb-px'
                : 'text-[#888] hover:text-[#111]'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
