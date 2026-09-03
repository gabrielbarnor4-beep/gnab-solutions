import { supabase } from '@/lib/supabase'

/* ------------------------------------------------------------------ */
/* Trash center — every soft-deleted row anywhere in admin, in one place */
/* Mirrors the nightly `purge_soft_deleted_30d` cron (03:22): anything   */
/* with deleted_at older than 30 days is hard-deleted automatically.    */
/* Here the admin sees days-left and can purge instantly instead.       */
/* ------------------------------------------------------------------ */

export const TRASH_GRACE_DAYS = 30

export interface TrashTable {
  table: string
  label: string
  /** admin list page the item lives on */
  page: string
  /** columns tried in order for the row title */
  nameCols: string[]
  /** extra columns shown as subtitle */
  subCols: string[]
  /** storage URL columns cleaned up when purging (best-effort) */
  fileCols: string[]
}

export const TRASH_TABLES: TrashTable[] = [
  { table: 'quote_requests', label: 'Quote Requests', page: '/admin/quotes', nameCols: ['rfq_number'], subCols: ['full_name', 'company_name'], fileCols: ['attachment_urls'] },
  { table: 'quotations', label: 'Quotations', page: '/admin/quotes', nameCols: ['quotation_number'], subCols: ['customer_name'], fileCols: [] },
  { table: 'receipts', label: 'Receipts', page: '/admin/receipts', nameCols: ['receipt_number'], subCols: ['customer_name'], fileCols: [] },
  { table: 'contact_messages', label: 'Messages', page: '/admin/messages', nameCols: ['full_name'], subCols: ['subject', 'email'], fileCols: ['attachment_urls'] },
  { table: 'suppliers', label: 'Suppliers', page: '/admin/suppliers', nameCols: ['company_name'], subCols: ['contact_person', 'email'], fileCols: ['attachment_urls', 'document_urls'] },
  { table: 'testimonials', label: 'Testimonials', page: '/admin/testimonials', nameCols: ['client_name'], subCols: ['company'], fileCols: [] },
  { table: 'products', label: 'Products', page: '/admin/products', nameCols: ['name'], subCols: ['category'], fileCols: ['image_url'] },
  { table: 'product_categories', label: 'Product Categories', page: '/admin/products', nameCols: ['name'], subCols: [], fileCols: [] },
  { table: 'services', label: 'Services', page: '/admin/services', nameCols: ['name'], subCols: ['category'], fileCols: ['image_url'] },
  { table: 'industries', label: 'Industries', page: '/admin/industries', nameCols: ['name'], subCols: [], fileCols: ['image_url'] },
  { table: 'why_choose_us', label: 'Why Choose Us', page: '/admin/why-us', nameCols: ['title'], subCols: [], fileCols: ['image_url'] },
  { table: 'process_steps', label: 'Process Steps', page: '/admin/process', nameCols: ['title'], subCols: ['step_number'], fileCols: [] },
  { table: 'blog_posts', label: 'Blog Posts', page: '/admin/blog', nameCols: ['title'], subCols: ['category'], fileCols: ['featured_image_url'] },
  { table: 'site_images', label: 'Media Library', page: '/admin/media', nameCols: ['alt_text', 'section'], subCols: ['section'], fileCols: ['url'] },
  { table: 'company_documents', label: 'Downloads', page: '/admin/downloads', nameCols: ['file_name'], subCols: [], fileCols: ['file_path'] },
  { table: 'locations', label: 'Locations', page: '/admin/locations', nameCols: ['name'], subCols: ['address'], fileCols: [] },
  { table: 'assistant_questions', label: 'Assistant Q&A', page: '/admin/assistant', nameCols: ['question'], subCols: ['status'], fileCols: [] },
]

export interface TrashItem {
  key: string
  table: string
  tableLabel: string
  page: string
  id: string
  title: string
  sub: string
  deletedAt: string
  daysLeft: number
}

const str = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '')

/** Whole days left before the nightly purge hard-deletes the row (0 = due). */
export function daysLeft(deletedAt: string, graceDays = TRASH_GRACE_DAYS, now = Date.now()): number {
  const elapsed = now - new Date(deletedAt).getTime()
  if (Number.isNaN(elapsed)) return graceDays
  return Math.max(0, graceDays - Math.floor(elapsed / 86_400_000))
}

/** Split a Supabase public URL (or bare path) into bucket + path for storage.remove(). */
export function extractStorageRef(url: string): { bucket: string; path: string } | null {
  const raw = (url || '').trim()
  if (!raw) return null
  // absolute public URL: .../storage/v1/object/public/<bucket>/<path>
  const marker = '/storage/v1/object/public/'
  const idx = raw.indexOf(marker)
  if (idx !== -1) {
    const rest = decodeURIComponent(raw.slice(idx + marker.length))
    const slash = rest.indexOf('/')
    if (slash === -1) return null
    return { bucket: rest.slice(0, slash), path: rest.slice(slash + 1) }
  }
  // company_documents stores a bare path like company-profile/x.pdf (documents bucket)
  if (!raw.includes('://') && raw.includes('/') && !raw.startsWith('/')) {
    if (raw.startsWith('company-profile/')) return { bucket: 'documents', path: raw }
    return null
  }
  return null
}

function rowTitle(row: Record<string, unknown>, cols: string[], max = 80): string {
  for (const c of cols) {
    const v = str(row[c]).trim()
    if (v) return v.length > max ? `${v.slice(0, max)}…` : v
  }
  return str(row.id) || 'Untitled'
}

export async function fetchTrash(): Promise<{ items: TrashItem[]; errors: string[] }> {
  const items: TrashItem[] = []
  const errors: string[] = []
  await Promise.all(
    TRASH_TABLES.map(async (t) => {
      try {
        const cols = ['id', 'deleted_at', ...t.nameCols, ...t.subCols].join(',')
        const { data, error } = await supabase.from(t.table).select(cols).not('deleted_at', 'is', null).order('deleted_at', { ascending: true }).limit(200)
        if (error) {
          // table missing (migrations not run) — skip silently unless it's unexpected
          if ((error as { code?: string }).code !== '42P01') errors.push(`${t.label}: ${error.message}`)
          return
        }
        for (const row of ((data as unknown as Record<string, unknown>[]) ?? [])) {
          const deletedAt = str(row.deleted_at)
          if (!deletedAt) continue
          items.push({
            key: `${t.table}-${str(row.id)}`,
            table: t.table,
            tableLabel: t.label,
            page: t.page,
            id: str(row.id),
            title: rowTitle(row, t.nameCols),
            sub: t.subCols.map((c) => str(row[c]).trim()).filter(Boolean).join(' · '),
            deletedAt,
            daysLeft: daysLeft(deletedAt),
          })
        }
      } catch (e) {
        errors.push(`${t.label}: ${e instanceof Error ? e.message : 'failed'}`)
      }
    }),
  )
  items.sort((a, b) => a.daysLeft - b.daysLeft || a.deletedAt.localeCompare(b.deletedAt))
  return { items, errors }
}

/** Best-effort storage cleanup for a row about to be purged. Never throws. */
async function cleanupRowFiles(table: string, id: string): Promise<void> {
  try {
    const cfg = TRASH_TABLES.find((t) => t.table === table)
    if (!cfg || cfg.fileCols.length === 0) return
    const { data } = await supabase.from(table).select(`id,${cfg.fileCols.join(',')}`).eq('id', id).maybeSingle()
    if (!data) return
    const row = data as unknown as Record<string, unknown>
    const byBucket = new Map<string, string[]>()
    const push = (url: string) => {
      // image_url / featured_image_url / url / file_path may be absolute, bare path, or CSV-ish
      for (const part of String(url).split(/[,\n]/)) {
        const ref = extractStorageRef(part)
        if (ref && ref.path) {
          const arr = byBucket.get(ref.bucket) ?? []
          if (!arr.includes(ref.path)) arr.push(ref.path)
          byBucket.set(ref.bucket, arr)
        }
      }
    }
    for (const col of cfg.fileCols) {
      const v = row[col]
      if (Array.isArray(v)) v.forEach((u) => typeof u === 'string' && push(u))
      else if (typeof v === 'string') push(v)
    }
    for (const [bucket, paths] of byBucket) {
      try {
        await supabase.storage.from(bucket).remove(paths)
      } catch { /* keep going — row delete matters most */ }
    }
  } catch { /* never block the purge */ }
}

/** Permanently delete one trashed row (files first, then the row). */
export async function purgeTrashItem(item: Pick<TrashItem, 'table' | 'id'>): Promise<{ error?: string }> {
  await cleanupRowFiles(item.table, item.id)
  const { error } = await supabase.from(item.table).delete().eq('id', item.id)
  if (error) return { error: error.message }
  return {}
}

/** Restore one trashed row (clears deleted_at, like per-page Undo). */
export async function restoreTrashItem(item: Pick<TrashItem, 'table' | 'id'>): Promise<{ error?: string }> {
  const { error } = await supabase.from(item.table).update({ deleted_at: null } as never).eq('id', item.id)
  if (error) return { error: error.message }
  return {}
}
