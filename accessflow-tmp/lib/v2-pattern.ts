import { PatternBucket } from './v2-types'

export const CANONICAL_KEYS = [
  'nav-keyboard-trap',
  'missing-skip-link',
  'unlabeled-form-input',
  'icon-link-no-accessible-name',
  'search-control-not-button',
  'missing-alt-text-pattern',
  'pdf-missing-document-title',
  'pdf-untagged-content',
  'missing-heading-structure',
  'low-color-contrast',
  'auto-playing-media',
  'missing-captions',
  'table-no-header-markup',
  'button-empty-label',
  'focus-not-visible',
  'landmark-regions-missing',
] as const

export type CanonicalKey = typeof CANONICAL_KEYS[number]

export const BUCKET_BY_KEY: Record<CanonicalKey, PatternBucket> = {
  'nav-keyboard-trap':              'navigation',
  'missing-skip-link':              'navigation',
  'landmark-regions-missing':       'navigation',
  'unlabeled-form-input':           'forms',
  'table-no-header-markup':         'forms',
  'search-control-not-button':      'search',
  'icon-link-no-accessible-name':   'buttons-links',
  'button-empty-label':             'buttons-links',
  'missing-alt-text-pattern':       'media',
  'auto-playing-media':             'media',
  'missing-captions':               'media',
  'pdf-missing-document-title':     'document-pdf',
  'pdf-untagged-content':           'document-pdf',
  'missing-heading-structure':      'layout-template',
  'low-color-contrast':             'layout-template',
  'focus-not-visible':              'layout-template',
}

const BUCKET_KEYWORDS: Record<PatternBucket, string[]> = {
  'navigation':       ['nav', 'menu', 'skip', 'landmark', 'keyboard', 'tab order'],
  'forms':            ['form', 'input', 'label', 'field', 'radio', 'checkbox', 'select', 'textarea', 'table'],
  'buttons-links':    ['button', 'link', 'icon', 'click', 'accessible name', 'cta'],
  'search':           ['search', 'query', 'find'],
  'media':            ['image', 'img', 'alt', 'caption', 'video', 'audio', 'autoplay', 'media'],
  'document-pdf':     ['pdf', 'document', 'tagged', 'reading order', 'file'],
  'layout-template':  ['heading', 'color', 'contrast', 'focus', 'visible', 'region', 'landmark', 'template'],
}

export function classifyPatternBucket(issueTitle: string, canonicalKey: string): PatternBucket {
  const key = canonicalKey as CanonicalKey
  if (BUCKET_BY_KEY[key]) return BUCKET_BY_KEY[key]

  const lower = issueTitle.toLowerCase()
  for (const [bucket, keywords] of Object.entries(BUCKET_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return bucket as PatternBucket
  }
  return 'layout-template'
}

export function normalizeCanonicalKey(raw: string): CanonicalKey {
  const cleaned = raw.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  if ((CANONICAL_KEYS as readonly string[]).includes(cleaned)) return cleaned as CanonicalKey
  return findClosestKey(raw)
}

function findClosestKey(raw: string): CanonicalKey {
  const lower = raw.toLowerCase()
  if (lower.includes('nav') || lower.includes('keyboard') || lower.includes('skip')) return 'nav-keyboard-trap'
  if (lower.includes('form') || lower.includes('input') || lower.includes('label')) return 'unlabeled-form-input'
  if (lower.includes('button') || lower.includes('icon') || lower.includes('link')) return 'icon-link-no-accessible-name'
  if (lower.includes('search')) return 'search-control-not-button'
  if (lower.includes('alt') || lower.includes('image')) return 'missing-alt-text-pattern'
  if (lower.includes('pdf') || lower.includes('document')) return 'pdf-untagged-content'
  if (lower.includes('heading') || lower.includes('structure')) return 'missing-heading-structure'
  if (lower.includes('contrast') || lower.includes('color')) return 'low-color-contrast'
  if (lower.includes('focus')) return 'focus-not-visible'
  return 'landmark-regions-missing'
}
