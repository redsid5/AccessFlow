'use client'

import { STORAGE_KEYS } from './config'

// Set NEXT_PUBLIC_EXPERT_PASSCODE in Vercel env to override the default
const PASSCODE = process.env.NEXT_PUBLIC_EXPERT_PASSCODE ?? '0511'

export function isExpertUnlocked(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEYS.expertUnlocked) === 'true'
}

export function unlockExpert(input: string): boolean {
  if (input === PASSCODE) {
    localStorage.setItem(STORAGE_KEYS.expertUnlocked, 'true')
    return true
  }
  return false
}

export function lockExpert(): void {
  localStorage.removeItem(STORAGE_KEYS.expertUnlocked)
}
