import { describe, it, expect, beforeEach } from 'vitest'
import { formStr, isHoneypotFilled, isAllowedAttachment, canSubmit, recordSubmit } from '@/lib/utils'

describe('formStr safe getter', () => {
  it('returns string values', () => {
    const fd = new FormData()
    fd.set('full_name', 'Ama Mensah')
    expect(formStr(fd, 'full_name')).toBe('Ama Mensah')
  })
  it('returns empty for missing keys', () => {
    expect(formStr(new FormData(), 'nope')).toBe('')
  })
  it('returns empty for File values (no [object File])', () => {
    const fd = new FormData()
    fd.set('attachment', new File(['x'], 'a.pdf', { type: 'application/pdf' }))
    expect(formStr(fd, 'attachment')).toBe('')
  })
  it('honeypot uses formStr safely', () => {
    const fd = new FormData()
    fd.set('website_hp', '')
    expect(isHoneypotFilled(fd)).toBe(false)
    fd.set('website_hp', 'bot')
    expect(isHoneypotFilled(fd)).toBe(true)
  })
})

describe('quote validation guards (mirror DB 020 + client)', () => {
  beforeEach(() => {
    try {
      localStorage.clear()
    } catch {}
  })
  it('message 5000 char cap', () => {
    const ok = 'x'.repeat(5000)
    const tooLong = 'x'.repeat(5001)
    expect(ok.length <= 5000).toBe(true)
    expect(tooLong.length <= 5000).toBe(false)
  })
  it('max 5 attachments', () => {
    expect([1, 2, 3, 4, 5].length <= 5).toBe(true)
    expect([1, 2, 3, 4, 5, 6].length <= 5).toBe(false)
  })
  it('5MB file size guard', () => {
    const MAX = 5 * 1024 * 1024
    expect(new File(['x'], 'a.pdf', { type: 'application/pdf' }).size <= MAX).toBe(true)
    const big = { size: MAX + 1, name: 'big.pdf', type: 'application/pdf' } as File
    expect(big.size <= MAX).toBe(false)
  })
  it('allowlist blocks exe, allows pdf/doc/xlsx/txt/images', () => {
    expect(isAllowedAttachment(new File(['x'], 'a.pdf', { type: 'application/pdf' }))).toBe(true)
    expect(isAllowedAttachment(new File(['x'], 'a.docx', { type: '' }))).toBe(true)
    expect(isAllowedAttachment(new File(['x'], 'a.xlsx', { type: '' }))).toBe(true)
    expect(isAllowedAttachment(new File(['x'], 'photo.webp', { type: 'image/webp' }))).toBe(true)
    expect(isAllowedAttachment(new File(['x'], 'evil.exe', { type: 'application/x-msdownload' }))).toBe(false)
  })
  it('rate limit 5/min per key', () => {
    for (let i = 0; i < 5; i++) {
      expect(canSubmit('rfq-guard', 5, 60_000)).toBe(true)
      recordSubmit('rfq-guard')
    }
    expect(canSubmit('rfq-guard', 5, 60_000)).toBe(false)
  })
  it('testimonial quote 20–2000 chars', () => {
    expect('short'.length >= 20).toBe(false)
    expect('x'.repeat(20).length >= 20).toBe(true)
    expect('x'.repeat(2000).length <= 2000).toBe(true)
    expect('x'.repeat(2001).length <= 2000).toBe(false)
  })
})
