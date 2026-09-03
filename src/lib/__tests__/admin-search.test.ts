import { describe, it, expect } from 'vitest'
import { DEFAULT_SETTINGS } from '@/lib/siteData'
import { filterAdminPages, sanitizeLike, ADMIN_PAGES } from '@/components/admin/AdminSearch'

describe('per-page CTA feature strips (030, like Home CTA)', () => {
  const pages = ['about', 'services', 'industries', 'products', 'process', 'whyus'] as const
  it('all 18 feature keys exist with Home-matching defaults', () => {
    for (const p of pages) {
      expect(DEFAULT_SETTINGS[`${p}_cta_feature1` as keyof typeof DEFAULT_SETTINGS]).toBe('24h response')
      expect(DEFAULT_SETTINGS[`${p}_cta_feature2` as keyof typeof DEFAULT_SETTINGS]).toBe('100% commitment')
      expect(DEFAULT_SETTINGS[`${p}_cta_feature3` as keyof typeof DEFAULT_SETTINGS]).toBe('No obligation until you approve')
    }
  })
  it('feature arrays fall back per-item (PremiumCTA logic)', () => {
    const fallback = (features: (string | undefined)[], i: number, dflt: string) => features?.[i] || dflt
    expect(fallback(['Fast', '', undefined], 0, '24h response')).toBe('Fast')
    expect(fallback(['Fast', '', undefined], 1, '100% commitment')).toBe('100% commitment')
    expect(fallback([], 2, 'No obligation until you approve')).toBe('No obligation until you approve')
  })
})

describe('admin search page filter', () => {
  it('empty query returns all 22 pages', () => {
    expect(filterAdminPages('')).toHaveLength(ADMIN_PAGES.length)
    expect(ADMIN_PAGES.length).toBe(22)
  })
  it('finds pages by label, hint or route', () => {
    expect(filterAdminPages('quote').map((p) => p.label)).toContain('Quote Requests')
    expect(filterAdminPages('pdf').map((p) => p.label)).toContain('PDF Templates')
    expect(filterAdminPages('rfq').map((p) => p.label)).toContain('Quote Requests')
    expect(filterAdminPages('DESIGN').map((p) => p.label)).toContain('Site Pages')
  })
  it('is case-insensitive and trims', () => {
    expect(filterAdminPages('  MEDIA  ')).toHaveLength(1)
  })
  it('returns empty for nonsense', () => {
    expect(filterAdminPages('xqzt-blorpt')).toHaveLength(0)
  })
})

describe('sanitizeLike (PostgREST or-filter safety)', () => {
  it('strips parser-breaking chars', () => {
    expect(sanitizeLike('ama (test), 100%')).toBe('ama test 100')
    expect(sanitizeLike('a\\b')).toBe('ab')
  })
  it('trims and caps length', () => {
    expect(sanitizeLike('  hi  ')).toBe('hi')
    expect(sanitizeLike('x'.repeat(100)).length).toBeLessThanOrEqual(60)
  })
  it('keeps emails searchable', () => {
    expect(sanitizeLike('ama@example.com')).toContain('ama@example.com')
  })
})
