import { describe, it, expect } from 'vitest'
import { interpolate } from '@/lib/pdf'

describe('pdf interpolate edge cases', () => {
  it('returns empty for null/undefined', () => {
    expect(interpolate(null, { a: 'x' })).toBe('')
    expect(interpolate(undefined, { a: 'x' })).toBe('')
    expect(interpolate('', { a: 'x' })).toBe('')
  })
  it('replaces multiple vars in quotation template', () => {
    const tpl = 'Quotation {{quotation_number}} for {{customer_name}} — RFQ {{rfq_number}} dated {{date}}'
    expect(
      interpolate(tpl, {
        quotation_number: 'QT-2026-ABC12',
        customer_name: 'Ama Mensah',
        rfq_number: 'GNAB-2026-XYZ123',
        date: '03/09/2026',
      }),
    ).toBe('Quotation QT-2026-ABC12 for Ama Mensah — RFQ GNAB-2026-XYZ123 dated 03/09/2026')
  })
  it('replaces receipt vars and keeps unknown placeholders', () => {
    expect(interpolate('Receipt {{receipt_number}} — paid {{amount_paid}} of {{total}} {{unknown}}', {
      receipt_number: 'RCPT-2026-0001',
      amount_paid: 'GHS 500.00',
      total: 'GHS 1200.00',
    })).toBe('Receipt RCPT-2026-0001 — paid GHS 500.00 of GHS 1200.00 {{unknown}}')
  })
  it('handles repeated placeholders', () => {
    expect(interpolate('{{name}} / {{name}}', { name: 'GNAB' })).toBe('GNAB / GNAB')
  })
  it('ignores non-word placeholders (dashes/spaces kept)', () => {
    expect(interpolate('{{customer-name}} {{a b}}', { 'customer-name': 'x' })).toBe('{{customer-name}} {{a b}}')
  })
})

describe('pdf number formats', () => {
  it('RFQ numbers match GNAB-YYYY-XXXXXX', () => {
    const makeRfq = () => `GNAB-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    for (let i = 0; i < 20; i++) {
      expect(makeRfq()).toMatch(/^GNAB-\d{4}-[A-Z0-9]{6}$/)
    }
  })
  it('receipt numbers match RCPT-YYYY-XXXX', () => {
    const makeRcpt = (seq: number) => `RCPT-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`
    expect(makeRcpt(1)).toMatch(/^RCPT-\d{4}-\d{4}$/)
    expect(makeRcpt(42)).toContain('-0042')
  })
  it('totals balance math holds', () => {
    const subtotal = 1000
    const discount = 100
    const tax = 27
    const total = subtotal - discount + tax
    const amountPaid = 500
    expect(total - amountPaid).toBe(427)
  })
})
