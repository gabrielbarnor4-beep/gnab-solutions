import { describe, it, expect } from 'vitest'
import { matchSlug, slugify, splitHighlight, titleSizeClass, ctaThemeClass } from '@/lib/design'

describe('matchSlug (fuzzy card → filtered page matching)', () => {
  it('matches exact slugs', () => {
    expect(matchSlug('ppe-safety', 'ppe-safety')).toBe(true)
  })
  it('matches when service name is longer than the group slug', () => {
    expect(matchSlug('ppe-safety-equipment', 'ppe-safety')).toBe(true)
    expect(matchSlug('custom-procurement-sourcing', 'custom-sourcing')).toBe(true)
  })
  it('matches raw names, not just slugs', () => {
    expect(matchSlug('PPE & Safety Equipment', 'ppe-safety')).toBe(true)
    expect(matchSlug('Corporate Organisations', 'Corporate')).toBe(true)
  })
  it('rejects unrelated slugs and empties', () => {
    expect(matchSlug('ppe-safety', 'office-furniture')).toBe(false)
    expect(matchSlug('', 'ppe-safety')).toBe(false)
    expect(matchSlug('ppe-safety', '')).toBe(false)
  })
})

describe('slugify (shared: services + industries + home cards)', () => {
  it('slugifies industry names like IndustriesPage', () => {
    expect(slugify('Corporate Organisations')).toBe('corporate-organisations')
    expect(slugify('Government & Public Sector')).toBe('government-public-sector')
    expect(slugify('NGOs & Development')).toBe('ngos-development')
    expect(slugify('SMEs')).toBe('smes')
  })
  it('home industry slugs match page slugs', () => {
    // Home short cards map to full page names (see HomePage industries array)
    const homeToPage: Record<string, string> = {
      'corporate-organisations': 'Corporate Organisations',
      'government-public-sector': 'Government & Public Sector',
      'schools-universities': 'Schools & Universities',
      'hospitals-healthcare': 'Hospitals & Healthcare',
      'hotels-hospitality': 'Hotels & Hospitality',
      'construction-companies': 'Construction Companies',
      'ngos-development': 'NGOs & Development',
      smes: 'SMEs',
    }
    for (const [homeSlug, pageName] of Object.entries(homeToPage)) {
      const pageSlug = slugify(pageName)
      const match = pageSlug === homeSlug || pageSlug.includes(homeSlug) || homeSlug.includes(pageSlug)
      expect(match, `${homeSlug} should match ${pageName} -> ${pageSlug}`).toBe(true)
    }
  })
  it('highlight reorder logic: matching card goes first', () => {
    const names = ['Corporate Organisations', 'SMEs', 'Hospitals & Healthcare']
    const highlightSlug = slugify('healthcare')
    const idx = names.findIndex((n) => {
      const slug = slugify(n)
      return slug === highlightSlug || slug.includes(highlightSlug) || highlightSlug.includes(slug)
    })
    expect(idx).toBe(2)
    const copy = [...names]
    const [hit] = copy.splice(idx, 1)
    if (hit) copy.unshift(hit)
    expect(copy[0]).toBe('Hospitals & Healthcare')
  })
})

describe('splitHighlight (Home COT gold-tail design)', () => {
  it('splits title + highlight like "Ready to Simplify" + "Your Procurement?"', () => {
    expect(splitHighlight('Ready to Simplify Your Procurement?', 'Your Procurement?')).toEqual({
      prefix: 'Ready to Simplify',
      gold: 'Your Procurement?',
    })
  })
  it('splits per-page CTA titles', () => {
    expect(splitHighlight('Need Something Specific?', 'Something Specific?').gold).toBe('Something Specific?')
    expect(splitHighlight("Don't See Your Sector?", 'Your Sector?').gold).toBe('Your Sector?')
    expect(splitHighlight('Experience the GNAB Difference', 'GNAB Difference')).toEqual({
      prefix: 'Experience the',
      gold: 'GNAB Difference',
    })
  })
  it('returns plain title when highlight empty or missing', () => {
    expect(splitHighlight('Need Something Specific?', '')).toEqual({ prefix: 'Need Something Specific?', gold: '' })
    expect(splitHighlight('Hello World', 'Nope')).toEqual({ prefix: 'Hello World', gold: '' })
    expect(splitHighlight('', 'x')).toEqual({ prefix: '', gold: '' })
  })
})

describe('titleSizeClass', () => {
  it('returns distinct classes per size', () => {
    const compact = titleSizeClass('compact', 'cta')
    const standard = titleSizeClass('standard', 'cta')
    const grand = titleSizeClass('grand', 'cta')
    expect(new Set([compact, standard, grand]).size).toBe(3)
    expect(standard).toContain('md:text-5xl')
  })
  it('home-hero sizes differ', () => {
    expect(titleSizeClass('grand', 'home-hero')).toContain('80px')
    expect(titleSizeClass('standard', 'home-hero')).toContain('68px')
  })
})

describe('ctaThemeClass', () => {
  it('three themes with distinct outer gradients', () => {
    const navy = ctaThemeClass('navy-gold')
    const emerald = ctaThemeClass('emerald')
    const midnight = ctaThemeClass('midnight')
    expect(navy.outer).toContain('gold')
    expect(emerald.outer).toContain('emerald')
    expect(midnight.outer).toContain('gold')
    expect(emerald.inner).not.toBe(navy.inner)
    expect(midnight.inner).not.toBe(navy.inner)
  })
  it('falls back to navy-gold for unknown', () => {
    expect(ctaThemeClass('nope').outer).toBe(ctaThemeClass('navy-gold').outer)
  })
})
