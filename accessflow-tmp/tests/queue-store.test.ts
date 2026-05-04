import { beforeEach, describe, expect, it } from 'vitest'
import {
  addToQueue,
  clearQueue,
  computeStats,
  getActiveCount,
  getQueue,
  removeFromQueue,
  updateQueueItem,
} from '@/lib/queue-store'
import type { TriageResult } from '@/lib/types'

const RESULT: TriageResult = {
  decision: 'fix',
  priority: 'High',
  contentDescription: 'Financial aid form',
  why: 'Screen readers cannot complete the form.',
  action: 'Rebuild with labelled fields.',
  owner: 'Web team',
  confidence: 88,
  signals: {
    publicFacing: true,
    studentImpact: true,
    betterAsHTML: false,
    likelyLowValue: false,
    timeSensitive: false,
    missionCritical: true,
  },
  priorityScore: {
    studentImpact: 9,
    legalRisk: 8,
    usageFrequency: 7,
    contentReplaceability: 5,
    timeSensitivity: 6,
    total: 78,
  },
  estimatedEffort: '2 hours',
  usageSignal: 'high-traffic',
  wcagContext: '',
  roleNote: 'Assign to web team this week.',
}

beforeEach(() => {
  clearQueue()
})

describe('getQueue', () => {
  it('returns empty array when nothing is stored', () => {
    expect(getQueue()).toEqual([])
  })
})

describe('addToQueue', () => {
  it('persists a new item and returns it', () => {
    const item = addToQueue('financial-aid.pdf', 'pdf', 'staff', RESULT)
    expect(item.id).toBeTruthy()
    expect(item.status).toBe('new')
    expect(getQueue()).toHaveLength(1)
    expect(getQueue()[0].label).toBe('financial-aid.pdf')
  })

  it('prepends so the newest item is first', () => {
    addToQueue('first.pdf', 'pdf', 'staff', RESULT)
    addToQueue('second.pdf', 'pdf', 'staff', RESULT)
    expect(getQueue()[0].label).toBe('second.pdf')
  })
})

describe('updateQueueItem', () => {
  it('persists status changes', () => {
    const item = addToQueue('aid-form.pdf', 'pdf', 'staff', RESULT)
    updateQueueItem(item.id, { status: 'in-progress' })
    const updated = getQueue().find(i => i.id === item.id)!
    expect(updated.status).toBe('in-progress')
  })

  it('persists assignedTo and department', () => {
    const item = addToQueue('aid-form.pdf', 'pdf', 'admin', RESULT)
    updateQueueItem(item.id, { assignedTo: 'alex@univ.edu', department: 'Financial Aid' })
    const updated = getQueue().find(i => i.id === item.id)!
    expect(updated.assignedTo).toBe('alex@univ.edu')
    expect(updated.department).toBe('Financial Aid')
  })

  it('updates updatedAt timestamp', () => {
    const item = addToQueue('aid-form.pdf', 'pdf', 'staff', RESULT)
    const before = item.updatedAt
    updateQueueItem(item.id, { status: 'assigned' })
    const after = getQueue().find(i => i.id === item.id)!.updatedAt
    expect(after >= before).toBe(true)
  })

  it('does not modify other items', () => {
    const a = addToQueue('a.pdf', 'pdf', 'staff', RESULT)
    const b = addToQueue('b.pdf', 'pdf', 'staff', RESULT)
    updateQueueItem(a.id, { status: 'fixed' })
    const bAfter = getQueue().find(i => i.id === b.id)!
    expect(bAfter.status).toBe('new')
  })

  it('is a no-op for an unknown id', () => {
    addToQueue('aid-form.pdf', 'pdf', 'staff', RESULT)
    updateQueueItem('nonexistent-id', { status: 'fixed' })
    expect(getQueue()).toHaveLength(1)
    expect(getQueue()[0].status).toBe('new')
  })
})

describe('removeFromQueue', () => {
  it('removes the matching item', () => {
    const item = addToQueue('aid-form.pdf', 'pdf', 'staff', RESULT)
    removeFromQueue(item.id)
    expect(getQueue()).toHaveLength(0)
  })

  it('is a no-op for an unknown id', () => {
    addToQueue('aid-form.pdf', 'pdf', 'staff', RESULT)
    removeFromQueue('nonexistent')
    expect(getQueue()).toHaveLength(1)
  })
})

describe('getActiveCount', () => {
  it('counts only new/assigned/in-progress items', () => {
    const a = addToQueue('a.pdf', 'pdf', 'staff', RESULT)
    const b = addToQueue('b.pdf', 'pdf', 'staff', RESULT)
    updateQueueItem(a.id, { status: 'fixed' })
    expect(getActiveCount()).toBe(1)
    updateQueueItem(b.id, { status: 'archived' })
    expect(getActiveCount()).toBe(0)
  })
})

describe('computeStats', () => {
  it('returns zero totals for an empty queue', () => {
    const stats = computeStats([])
    expect(stats.total).toBe(0)
    expect(stats.byDecision.fix).toBe(0)
    expect(stats.criticalUnresolved).toBe(0)
  })

  it('counts fix+High items as criticalUnresolved when not resolved', () => {
    const item = addToQueue('aid-form.pdf', 'pdf', 'staff', RESULT)
    const stats = computeStats(getQueue())
    expect(stats.criticalUnresolved).toBe(1)
    updateQueueItem(item.id, { status: 'fixed' })
    expect(computeStats(getQueue()).criticalUnresolved).toBe(0)
  })

  it('accumulates remediation cost', () => {
    addToQueue('a.pdf', 'pdf', 'staff', RESULT)
    addToQueue('b.pdf', 'pdf', 'staff', RESULT)
    const stats = computeStats(getQueue())
    expect(stats.totalRemediationCost).toBeGreaterThan(0)
  })
})
