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
      <p className="text-xs font-mono uppercase tracking-wider text-[#888] mb-2">
        Who are you?
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ROLES.map(role => (
          <button
            key={role.value}
            onClick={() => onChange(role.value)}
            className={`text-left px-3 py-2.5 border text-sm transition-colors ${
              value === role.value
                ? 'border-black bg-black text-white'
                : 'border-[#e5e5e5] text-[#111] hover:border-black'
            }`}
          >
            <span className="block font-medium text-xs leading-tight">{role.label}</span>
            <span className={`block font-mono text-[10px] mt-0.5 ${value === role.value ? 'text-[#aaa]' : 'text-[#888]'}`}>
              {role.note}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
