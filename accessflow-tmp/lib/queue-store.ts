'use client'

import { QueueItem, ItemStatus, TriageResult, ContentType, Role } from './types'
import { STORAGE_KEYS, EFFORT_HOURS, REMEDIATION_RATE_USD, ACTIVE_STATUSES } from './config'

export function getQueue(): QueueItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.queue)
    return raw ? (JSON.parse(raw) as QueueItem[]) : []
  } catch {
    return []
  }
}

function saveQueue(items: QueueItem[]): void {
  localStorage.setItem(STORAGE_KEYS.queue, JSON.stringify(items))
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
  saveQueue([item, ...getQueue()])
  return item
}

export function updateQueueItem(id: string, patch: Partial<Omit<QueueItem, 'id' | 'createdAt'>>): void {
  const updated = getQueue().map(item =>
    item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
  )
  saveQueue(updated)
}

export function removeFromQueue(id: string): void {
  saveQueue(getQueue().filter(item => item.id !== id))
}

export function clearQueue(): void {
  saveQueue([])
}

export function getActiveCount(): number {
  return getQueue().filter(i => (ACTIVE_STATUSES as readonly string[]).includes(i.status)).length
}

export function remediationCost(item: QueueItem): number {
  return EFFORT_HOURS[item.result.estimatedEffort] * REMEDIATION_RATE_USD
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
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const byDecision = { fix: 0, review: 0, delete: 0 }
  const byStatus: Record<ItemStatus, number> = {
    new: 0, assigned: 0, 'in-progress': 0, fixed: 0, archived: 0, exempted: 0,
  }
  const byPriority = { High: 0, Medium: 0, Low: 0 }
  const resolved = new Set(['fixed', 'archived', 'exempted'])
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

    if (resolved.has(item.status) && item.updatedAt >= monthStart) resolvedThisMonth++
    if (item.result.decision === 'fix' && item.result.priority === 'High' && !resolved.has(item.status)) {
      criticalUnresolved++
    }
  }

  return { total: items.length, byDecision, byStatus, byPriority, totalRemediationCost, projectedSavings, resolvedThisMonth, criticalUnresolved }
}
