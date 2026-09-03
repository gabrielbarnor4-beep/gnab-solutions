import { describe, it, expect, beforeEach } from 'vitest'
import { canSubmit, recordSubmit, isHoneypotFilled, isAllowedAttachment, imgSrcSet } from '@/lib/utils'
import { interpolate } from '@/lib/pdf'

describe('honeypot', () => {
  it('website_hp must stay empty', () => {
    const fd = new FormData()
    fd.set('website_hp', '')
    expect(isHoneypotFilled(fd)).toBe(false)
    fd.set('website_hp', 'bot')
    expect(isHoneypotFilled(fd)).toBe(true)
  })
  it('ignores real website field', () => {
    const fd = new FormData()
    fd.set('website', 'https://example.com')
    fd.set('website_hp', '')
    expect(isHoneypotFilled(fd)).toBe(false)
  })
})

describe('rate limit 5/min', () => {
  beforeEach(() => { try { localStorage.clear() } catch {} })
  it('allows 5 then blocks', () => {
    const key = 'test-quote'
    for (let i = 0; i < 5; i++) {
      expect(canSubmit(key, 5, 60_000)).toBe(true)
      recordSubmit(key)
    }
    expect(canSubmit(key, 5, 60_000)).toBe(false)
  })
  it('different keys are independent', () => {
    recordSubmit('a')
    expect(canSubmit('b')).toBe(true)
  })
})

describe('isAllowedAttachment', () => {
  it('allows pdf and images', () => {
    expect(isAllowedAttachment(new File(['x'], 'a.pdf', { type: 'application/pdf' }))).toBe(true)
    expect(isAllowedAttachment(new File(['x'], 'b.png', { type: 'image/png' }))).toBe(true)
  })
  it('rejects exe via ext and type', () => {
    expect(isAllowedAttachment(new File(['x'], 'evil.exe', { type: 'application/x-msdownload' }))).toBe(false)
  })
  it('allows by ext even if mime empty', () => {
    expect(isAllowedAttachment(new File(['x'], 'doc.pdf', { type: '' }))).toBe(true)
  })
})

describe('imgSrcSet', () => {
  it('builds srcset for unsplash', () => {
    const url = 'https://images.unsplash.com/photo-xxx?w=2400&auto=format'
    const s = imgSrcSet(url, [400, 800])
    expect(s).toContain('w=400')
    expect(s).toContain('fm=webp 400w')
    expect(s).toContain('w=800')
  })
  it('returns url unchanged for non-unsplash', () => {
    const url = 'https://cdn.example.com/a.jpg'
    expect(imgSrcSet(url)).toBe(url)
  })
})

describe('pdf interpolate', () => {
  it('replaces {{vars}}', () => {
    expect(interpolate('Hello {{name}} — {{rfq_number}}', { name: 'Ama', rfq_number: 'GNAB-001' })).toBe('Hello Ama — GNAB-001')
  })
  it('keeps unknown placeholder', () => {
    expect(interpolate('{{unknown}}', {})).toBe('{{unknown}}')
  })
})

describe('env guard', () => {
  it('CONTACT logo is your real brand logo', async () => {
    const { CONTACT } = await import('@/lib/utils')
    expect(CONTACT.logo).toBe('https://dkbzvndtolkvuuxeaooh.supabase.co/storage/v1/object/public/media/branding/1788397307996-wb35sl.jpg')
  })
})
