/**
 * Audit harness — runs audit_set.json against the running dev server
 * and compares system decisions against human ground truth.
 *
 * Usage:
 *   npm run dev          (in another terminal)
 *   node tests/audit.mjs
 *
 * Writes results to tests/audit_results.json
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const BASE = 'http://localhost:3000'

const auditSet = JSON.parse(readFileSync(join(__dir, 'audit_set.json'), 'utf8'))

async function triageURL(label, role = 'staff') {
  const res = await fetch(`${BASE}/api/analyze-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: `https://${label}`, role }),
  })
  if (!res.ok) throw new Error(`${res.status}: ${(await res.json()).error}`)
  return res.json()
}

const results = []
let passed = 0
let failed = 0
let skipped = 0

for (const item of auditSet) {
  process.stdout.write(`  ${item.id} ... `)

  if (item.type !== 'url') {
    console.log('skip (pdf — requires file upload)')
    skipped++
    results.push({ ...item, status: 'skipped', reason: 'pdf requires file upload' })
    continue
  }

  try {
    const result = await triageURL(item.label)
    const match = result.decision === item.human_decision
    if (match) passed++
    else failed++

    console.log(match ? `pass (${result.decision})` : `FAIL — expected ${item.human_decision}, got ${result.decision}`)

    results.push({
      id: item.id,
      status: match ? 'pass' : 'fail',
      expected: item.human_decision,
      actual: result.decision,
      confidence: result.confidence,
      priority: result.priority,
      notes: item.notes,
      mismatch_source: !match
        ? (result.confidence < 70 ? 'low-confidence extraction' : 'rule mismatch — review policy logic')
        : null,
    })
  } catch (err) {
    console.log(`error — ${err.message}`)
    skipped++
    results.push({ id: item.id, status: 'error', error: err.message })
  }
}

const summary = {
  total: auditSet.length,
  passed,
  failed,
  skipped,
  accuracy: auditSet.length - skipped > 0
    ? `${Math.round((passed / (passed + failed)) * 100)}%`
    : 'n/a',
  results,
}

writeFileSync(join(__dir, 'audit_results.json'), JSON.stringify(summary, null, 2))

console.log(`\n  ${passed} passed · ${failed} failed · ${skipped} skipped`)
console.log(`  accuracy: ${summary.accuracy}`)
console.log(`  full results → tests/audit_results.json`)
