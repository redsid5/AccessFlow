'use client'

import { Role } from '@/lib/types'

const ROLES: { value: Role; label: string; note: string }[] = [
  { value: 'staff', label: 'Accessibility staff', note: 'Technical context included' },
  { value: 'faculty', label: 'Faculty', note: 'Student impact framing' },
  { value: 'admin', label: 'Department admin', note: 'Plain language, no jargon' },
  { value: 'student', label: 'Student worker', note: 'Simple, one-step instructions' },
]

interface RoleSelectorProps {
  value: Role
  onChange: (role: Role) => void
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="mb-6">
      <p className="text-xs font-mono uppercase tracking-wider text-[#888] dark:text-[#666660] mb-2">
        Who are you?
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ROLES.map(role => (
          <button
            key={role.value}
            onClick={() => onChange(role.value)}
            className={`text-left px-3 py-3 border transition-colors ${
              value === role.value
                ? 'border-[#111] dark:border-[#ededea] bg-[#111] dark:bg-[#ededea] text-white dark:text-[#111]'
                : 'border-[#e5e4df] dark:border-[#536878] text-[#111] dark:text-[#ededea] hover:border-[#111] dark:hover:border-[#ededea]'
            }`}
          >
            <span className="block font-medium text-sm leading-tight">{role.label}</span>
            <span className={`block font-mono text-xs mt-1 ${
              value === role.value ? 'text-[#aaa] dark:text-[#666660]' : 'text-[#888] dark:text-[#555550]'
            }`}>
              {role.note}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
