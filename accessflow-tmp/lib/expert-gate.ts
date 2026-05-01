'use client'

const STORAGE_KEY = 'accessflow_expert_unlocked'
const PASSCODE = '0511'

export function isExpertUnlocked(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

export function unlockExpert(input: string): boolean {
  if (input === PASSCODE) {
    localStorage.setItem(STORAGE_KEY, 'true')
    return true
  }
  return false
}

export function lockExpert(): void {
  localStorage.removeItem(STORAGE_KEY)
}
