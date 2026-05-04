import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { TriageResult } from '@/lib/types'

// Stub heavy dependencies before importing the route handlers
vi.mock('@/lib/classifier', () => ({
  classifyContent: vi.fn(),
}))
vi.mock('@/lib/url-scraper', () => ({
  scrapeURL: vi.fn(),
}))
vi.mock('@/lib/pdf-extractor', () => ({
  extractPDF: vi.fn(),
  analyzeFilename: vi.fn(),
}))
vi.mock('@/lib/config', async () => {
  const actual = await vi.importActual<typeof import('@/lib/config')>('@/lib/config')
  return { ...actual, getGeminiKey: () => 'test-key', withRetry: (fn: () => unknown) => fn() }
})

import { POST as analyzeURL } from '@/app/api/analyze-url/route'
import { POST as analyzePDF } from '@/app/api/analyze-pdf/route'
import { POST as technicalReview } from '@/app/api/technical-review/route'
import { classifyContent } from '@/lib/classifier'
import { scrapeURL } from '@/lib/url-scraper'
import { extractPDF, analyzeFilename } from '@/lib/pdf-extractor'

const MOCK_RESULT: TriageResult = {
  decision: 'fix',
  priority: 'High',
  contentDescription: 'Financial aid form',
  why: 'Screen readers cannot complete it.',
  action: 'Rebuild with labelled fields.',
  owner: 'Web team',
  confidence: 88,
  signals: {
    publicFacing: true, studentImpact: true, betterAsHTML: false,
    likelyLowValue: false, timeSensitive: false, missionCritical: true,
  },
  priorityScore: {
    studentImpact: 9, legalRisk: 8, usageFrequency: 7,
    contentReplaceability: 5, timeSensitivity: 6, total: 78,
  },
  estimatedEffort: '2 hours',
  usageSignal: 'high-traffic',
  wcagContext: '',
  roleNote: '',
}

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/analyze-url', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/analyze-url — input validation', () => {
  it('returns 400 when url is missing', async () => {
    const res = await analyzeURL(makeRequest({ role: 'staff' }) as never)
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/url/i)
  })

  it('returns 400 for a non-http url', async () => {
    const res = await analyzeURL(makeRequest({ url: 'ftp://example.com', role: 'staff' }) as never)
    expect(res.status).toBe(400)
  })
})

describe('POST /api/analyze-url — response contract', () => {
  beforeEach(() => {
    vi.mocked(scrapeURL).mockResolvedValue({
      text: 'Sample page text',
      title: 'Test Page',
      hasImages: false,
      hasForms: true,
      hasHeadings: true,
    })
    vi.mocked(classifyContent).mockResolvedValue(MOCK_RESULT)
  })

  it('returns a TriageResult with all required fields', async () => {
    const res = await analyzeURL(makeRequest({ url: 'https://example.com/aid', role: 'staff' }) as never)
    expect(res.status).toBe(200)
    const body = await res.json() as TriageResult
    expect(body.decision).toMatch(/^(fix|review|delete)$/)
    expect(body.priority).toMatch(/^(High|Medium|Low)$/)
    expect(typeof body.confidence).toBe('number')
    expect(body.priorityScore).toBeDefined()
    expect(typeof body.priorityScore.total).toBe('number')
  })

  it('falls back to staff role when role is invalid', async () => {
    await analyzeURL(makeRequest({ url: 'https://example.com', role: 'hacker' }) as never)
    expect(vi.mocked(classifyContent)).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'staff' })
    )
  })
})

describe('POST /api/analyze-pdf — input validation', () => {
  it('returns 400 when no file provided', async () => {
    const formData = new FormData()
    const req = new Request('http://localhost/api/analyze-pdf', {
      method: 'POST',
      body: formData,
    })
    const res = await analyzePDF(req as never)
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/file/i)
  })

  it('returns 400 for non-PDF files', async () => {
    const formData = new FormData()
    formData.append('file', new File(['hello'], 'doc.txt', { type: 'text/plain' }))
    const req = new Request('http://localhost/api/analyze-pdf', { method: 'POST', body: formData })
    const res = await analyzePDF(req as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 when file exceeds 10 MB', async () => {
    const big = new File([new Uint8Array(11 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', big)
    const req = new Request('http://localhost/api/analyze-pdf', { method: 'POST', body: formData })
    const res = await analyzePDF(req as never)
    expect(res.status).toBe(400)
  })
})

describe('POST /api/analyze-pdf — response contract', () => {
  beforeEach(() => {
    vi.mocked(extractPDF).mockResolvedValue({ text: 'PDF text content', pageCount: 3, metadata: {} })
    vi.mocked(analyzeFilename).mockReturnValue({})
    vi.mocked(classifyContent).mockResolvedValue(MOCK_RESULT)
  })

  it('returns a TriageResult with all required fields', async () => {
    const formData = new FormData()
    formData.append('file', new File(['%PDF-1.4 content'], 'aid.pdf', { type: 'application/pdf' }))
    const req = new Request('http://localhost/api/analyze-pdf', { method: 'POST', body: formData })
    const res = await analyzePDF(req as never)
    expect(res.status).toBe(200)
    const body = await res.json() as TriageResult
    expect(body.decision).toMatch(/^(fix|review|delete)$/)
    expect(body.priorityScore).toBeDefined()
  })
})

describe('POST /api/technical-review — input validation', () => {
  it('returns 400 when label is missing', async () => {
    const res = await technicalReview(makeRequest({ contentType: 'url', textSample: 'text' }) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 when contentType is invalid', async () => {
    const res = await technicalReview(makeRequest({ label: 'test', contentType: 'doc', textSample: 'text' }) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 when textSample is missing', async () => {
    const res = await technicalReview(makeRequest({ label: 'test', contentType: 'url' }) as never)
    expect(res.status).toBe(400)
  })
})
