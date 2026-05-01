'use client'

import { QueueItem, ItemStatus, TriageResult, ContentType, Role } from './types'

const STORAGE_KEY = 'accessflow_queue'

export function getQueue(): QueueItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as QueueItem[]) : []
  } catch {
    return []
  }
}

function saveQueue(items: QueueItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function addToQueue(
  label: string,
  type: ContentType,
  role: Role,
  result: TriageResult
): QueueItem {
  const item: QueueItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    type,
    role,
    result,
    status: 'new',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const current = getQueue()
  saveQueue([item, ...current])
  return item
}

export function updateQueueItem(id: string, patch: Partial<Omit<QueueItem, 'id' | 'createdAt'>>): void {
  const current = getQueue()
  const updated = current.map(item =>
    item.id === id
      ? { ...item, ...patch, updatedAt: new Date().toISOString() }
      : item
  )
  saveQueue(updated)
}

export function removeFromQueue(id: string): void {
  saveQueue(getQueue().filter(item => item.id !== id))
}

export function clearQueue(): void {
  saveQueue([])
}

// Cost model: $150/hr accessibility specialist rate
const EFFORT_HOURS: Record<string, number> = {
  '10 min': 1,
  '2 hours': 4,
  'multi-team project': 20,
}
const HOURLY_RATE = 150

export function remediationCost(item: QueueItem): number {
  return EFFORT_HOURS[item.result.estimatedEffort] * HOURLY_RATE
}

export interface DashboardStats {
  total: number
  byDecision: { fix: number; review: number; delete: number }
  byStatus: Record<ItemStatus, number>
  byPriority: { High: number; Medium: number; Low: number }
  totalRemediationCost: number
  projectedSavings: number
  resolvedThisMonth: number
  criticalUnresolved: number
}

export function computeStats(items: QueueItem[]): DashboardStats {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const byDecision = { fix: 0, review: 0, delete: 0 }
  const byStatus: Record<ItemStatus, number> = {
    new: 0, assigned: 0, 'in-progress': 0, fixed: 0, archived: 0, exempted: 0
  }
  const byPriority = { High: 0, Medium: 0, Low: 0 }
  let totalRemediationCost = 0
  let projectedSavings = 0
  let resolvedThisMonth = 0
  let criticalUnresolved = 0

  for (const item of items) {
    byDecision[item.result.decision]++
    byStatus[item.status]++
    byPriority[item.result.priority]++

    const cost = remediationCost(item)

    if (item.result.decision === 'delete') {
      projectedSavings += cost
    } else {
      totalRemediationCost += cost
    }

    if (['fixed', 'archived', 'exempted'].includes(item.status) && item.updatedAt >= monthStart) {
      resolvedThisMonth++
    }

    if (
      item.result.decision === 'fix' &&
      item.result.priority === 'High' &&
      !['fixed', 'archived', 'exempted'].includes(item.status)
    ) {
      criticalUnresolved++
    }
  }

  return {
    total: items.length,
    byDecision,
    byStatus,
    byPriority,
    totalRemediationCost,
    projectedSavings,
    resolvedThisMonth,
    criticalUnresolved,
  }
}
