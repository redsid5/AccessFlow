import { PatternBucket } from './v2-types'

export const CANONICAL_KEYS = [
  // navigation
  'nav-keyboard-trap',
  'missing-skip-link',
  'landmark-regions-missing',
  // forms
  'unlabeled-form-input',
  'form-error-not-described',
  'required-field-not-marked',
  // buttons & links
  'icon-link-no-accessible-name',
  'button-no-accessible-name',
  'button-empty-label',
  'link-ambiguous-text',
  // search
  'search-control-not-button',
  // media
  'missing-alt-text-pattern',
  'auto-playing-media',
  'missing-captions',
  // document / pdf
  'pdf-missing-document-title',
  'pdf-untagged-content',
  'pdf-inaccessible-form',
  // layout / template
  'missing-heading-structure',
  'low-color-contrast',
  'focus-not-visible',
  'table-no-header-markup',
  'language-not-set',
  // explicit fallback — never routes here silently
  'unknown-pattern',
] as const

export type CanonicalKey = typeof CANONICAL_KEYS[number]

export const BUCKET_BY_KEY: Record<CanonicalKey, PatternBucket> = {
  'nav-keyboard-trap':              'navigation',
  'missing-skip-link':              'navigation',
  'landmark-regions-missing':       'navigation',
  'unlabeled-form-input':           'forms',
  'form-error-not-described':       'forms',
  'required-field-not-marked':      'forms',
  'search-control-not-button':      'search',
  'icon-link-no-accessible-name':   'buttons-links',
  'button-no-accessible-name':      'buttons-links',
  'button-empty-label':             'buttons-links',
  'link-ambiguous-text':            'buttons-links',
  'missing-alt-text-pattern':       'media',
  'auto-playing-media':             'media',
  'missing-captions':               'media',
  'pdf-missing-document-title':     'document-pdf',
  'pdf-untagged-content':           'document-pdf',
  'pdf-inaccessible-form':          'document-pdf',
  'missing-heading-structure':      'layout-template',
  'low-color-contrast':             'layout-template',
  'focus-not-visible':              'layout-template',
  'table-no-header-markup':         'layout-template',
  'language-not-set':               'layout-template',
  'unknown-pattern':                'layout-template',
}

const BUCKET_KEYWORDS: Record<PatternBucket, string[]> = {
  'navigation':       ['nav', 'menu', 'skip', 'landmark', 'keyboard', 'tab order'],
  'forms':            ['form', 'input', 'label', 'field', 'radio', 'checkbox', 'select', 'textarea'],
  'buttons-links':    ['button', 'link', 'icon', 'click', 'accessible name', 'cta'],
  'search':           ['search', 'query', 'find'],
  'media':            ['image', 'img', 'alt', 'caption', 'video', 'audio', 'autoplay', 'media'],
  'document-pdf':     ['pdf', 'document', 'tagged', 'reading order', 'file'],
  'layout-template':  ['heading', 'color', 'contrast', 'focus', 'visible', 'region', 'landmark', 'template', 'table', 'language', 'lang'],
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

  // navigation — check specific patterns before generic nav/keyboard
  if (lower.includes('skip') && (lower.includes('link') || lower.includes('nav'))) return 'missing-skip-link'
  if (lower.includes('keyboard') && lower.includes('trap')) return 'nav-keyboard-trap'
  if (lower.includes('landmark') || lower.includes('region')) return 'landmark-regions-missing'
  if (lower.includes('nav') || lower.includes('keyboard') || lower.includes('tab order')) return 'nav-keyboard-trap'

  // search — before form/button to avoid 'search input' routing to forms
  if (lower.includes('search')) return 'search-control-not-button'

  // forms — specific patterns before generic input/label
  if ((lower.includes('error') || lower.includes('invalid')) &&
      (lower.includes('message') || lower.includes('described') || lower.includes('announced'))) return 'form-error-not-described'
  if (lower.includes('required') &&
      (lower.includes('field') || lower.includes('marked') || lower.includes('indicator'))) return 'required-field-not-marked'
  if (lower.includes('form') || lower.includes('input') || lower.includes('field') || lower.includes('label')) return 'unlabeled-form-input'

  // buttons & links — split by type, specific before generic
  if (lower.includes('link') && (lower.includes('ambiguous') || lower.includes('click here') || lower.includes('read more') || lower.includes('vague'))) return 'link-ambiguous-text'
  if ((lower.includes('icon') || lower.includes('svg')) && lower.includes('link')) return 'icon-link-no-accessible-name'
  if (lower.includes('button') && (lower.includes('empty') || lower.includes('no label') || lower.includes('no text'))) return 'button-empty-label'
  if (lower.includes('button')) return 'button-no-accessible-name'
  if (lower.includes('link') || lower.includes('icon')) return 'icon-link-no-accessible-name'

  // media
  if (lower.includes('caption') || lower.includes('transcript')) return 'missing-captions'
  if (lower.includes('autoplay') || lower.includes('auto-play') || lower.includes('auto play') ||
      lower.includes('moving') || lower.includes('animation') || lower.includes('blinking')) return 'auto-playing-media'
  if (lower.includes('alt') || lower.includes('image') || lower.includes('img')) return 'missing-alt-text-pattern'

  // document / pdf — specific before generic
  if (lower.includes('pdf') && (lower.includes('form') || lower.includes('fillable'))) return 'pdf-inaccessible-form'
  if (lower.includes('title') && lower.includes('document')) return 'pdf-missing-document-title'
  if (lower.includes('pdf') || lower.includes('document') || lower.includes('tagged') || lower.includes('reading order')) return 'pdf-untagged-content'

  // layout / template
  if (lower.includes('lang') || lower.includes('language')) return 'language-not-set'
  if (lower.includes('heading') || lower.includes('h1') || lower.includes('h2') || lower.includes('structure')) return 'missing-heading-structure'
  if (lower.includes('contrast') || lower.includes('color') || lower.includes('colour')) return 'low-color-contrast'
  if (lower.includes('focus') || lower.includes('outline')) return 'focus-not-visible'
  if (lower.includes('table') || lower.includes(' th ') || lower.includes('header cell')) return 'table-no-header-markup'

  // explicit fallback — nothing matched, flag for review
  return 'unknown-pattern'
}
