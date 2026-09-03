import { describe, it, expect } from 'vitest'
import { daysLeft, extractStorageRef, TRASH_TABLES, TRASH_GRACE_DAYS } from '@/lib/trash'

describe('trash grace window (mirrors nightly purge_soft_deleted_30d)', () => {
  const DAY = 86_400_000
  const now = new Date('2026-09-03T12:00:00Z').getTime()
  it('freshly deleted items have 30 days left', () => {
    expect(daysLeft(new Date(now - 1000).toISOString(), 30, now)).toBe(30)
  })
  it('counts down whole days', () => {
    expect(daysLeft(new Date(now - 10 * DAY).toISOString(), 30, now)).toBe(20)
    expect(daysLeft(new Date(now - 29 * DAY - 1000).toISOString(), 30, now)).toBe(1)
  })
  it('clamps at 0 once due (purge takes it that night)', () => {
    expect(daysLeft(new Date(now - 30 * DAY).toISOString(), 30, now)).toBe(0)
    expect(daysLeft(new Date(now - 90 * DAY).toISOString(), 30, now)).toBe(0)
  })
  it('defaults to the 30-day grace', () => {
    expect(TRASH_GRACE_DAYS).toBe(30)
    expect(daysLeft(new Date(now).toISOString(), undefined, now)).toBe(30)
  })
  it('invalid dates fall back to full grace (never hides an item)', () => {
    expect(daysLeft('not-a-date')).toBe(TRASH_GRACE_DAYS)
  })
})

describe('TRASH_TABLES covers every purged table', () => {
  const purged = [
    'products', 'product_categories', 'services', 'industries', 'why_choose_us',
    'process_steps', 'blog_posts', 'company_documents', 'testimonials', 'suppliers',
    'quote_requests', 'site_images', 'assistant_questions', 'locations',
    'contact_messages', 'quotations', 'receipts',
  ]
  it('lists all 17 cron-purged tables', () => {
    const tables = TRASH_TABLES.map((t) => t.table)
    for (const p of purged) expect(tables, p).toContain(p)
  })
  it('every table has a label, page and title columns', () => {
    for (const t of TRASH_TABLES) {
      expect(t.label.length).toBeGreaterThan(0)
      expect(t.page.startsWith('/admin/')).toBe(true)
      expect(t.nameCols.length).toBeGreaterThan(0)
    }
  })
})

describe('extractStorageRef (purge file cleanup)', () => {
  it('splits public URLs into bucket + path', () => {
    expect(extractStorageRef('https://x.supabase.co/storage/v1/object/public/attachments/quotes/a.pdf')).toEqual({
      bucket: 'attachments',
      path: 'quotes/a.pdf',
    })
    expect(extractStorageRef('https://x.supabase.co/storage/v1/object/public/media/home_hero/a.webp')).toEqual({
      bucket: 'media',
      path: 'home_hero/a.webp',
    })
  })
  it('handles bare documents paths', () => {
    expect(extractStorageRef('company-profile/x.pdf')).toEqual({ bucket: 'documents', path: 'company-profile/x.pdf' })
  })
  it('rejects empties and non-storage URLs', () => {
    expect(extractStorageRef('')).toBeNull()
    expect(extractStorageRef('https://example.com/a.pdf')).toBeNull()
    expect(extractStorageRef('just-a-name')).toBeNull()
  })
})
