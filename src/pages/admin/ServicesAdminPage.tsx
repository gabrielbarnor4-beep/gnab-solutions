import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Pencil, Plus, Search, Trash2, Undo2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageIntro } from '@/components/admin/AdminLayout'
import { Drawer, EmptyState, ErrorBanner, Skeletons } from '@/components/admin/bits'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { inputClass } from '@/components/ui'
import { useQuerySearch } from '@/components/admin/AdminSearch'
import { SERVICE_CATEGORY_OPTIONS } from '@/lib/catalogue'

interface Service {
  id: string
  name: string
  category: string | null
  short_description: string | null
  full_description: string | null
  image_url: string | null
  published: boolean
  show_in_footer: boolean
  footer_label: string | null
  footer_path: string | null
  display_order: number
  deleted_at: string | null
}

const CATEGORY_OPTIONS = SERVICE_CATEGORY_OPTIONS

const EMPTY: Service = {
  id: '', name: '', category: '', short_description: '', full_description: '',
  image_url: '', published: true, show_in_footer: false, footer_label: '', footer_path: '', display_order: 0,
  deleted_at: null,
}

export default function ServicesAdminPage() {
  const [rows, setRows] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useQuerySearch()
  const [catFilter, setCatFilter] = useState('all')
  const [editing, setEditing] = useState<Service | null>(null)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [showTrash, setShowTrash] = useState(false)

  useEffect(() => {
    document.title = 'Services | GNAB Admin'
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.from('services').select('*').order('display_order').order('created_at')
    if (err) setError(err.code === '42P01' ? 'Run supabase/migrations/005_catalogue_content.sql first.' : `Failed to load: ${err.message}`)
    setRows((data as Service[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rows.filter((r) => {
      const isDeleted = !!(r as unknown as { deleted_at: string | null }).deleted_at
      if (!showTrash && isDeleted) return false
      if (showTrash && !isDeleted) return false
      if (catFilter !== 'all' && r.category !== catFilter) return false
      if (!q) return true
      return r.name.toLowerCase().includes(q)
    })
  }, [rows, search, catFilter, showTrash])

  const save = async () => {
    if (!editing) return
    if (!editing.name.trim()) {
      setError('Service name is required.')
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      name: editing.name.trim(),
      category: editing.category || null,
      short_description: editing.short_description || null,
      full_description: editing.full_description || null,
      image_url: editing.image_url || null,
      published: editing.published,
      show_in_footer: !!editing.show_in_footer,
      footer_label: editing.footer_label?.trim() ? editing.footer_label.trim() : null,
      footer_path: editing.footer_path?.trim() ? editing.footer_path.trim() : null,
      display_order: Number(editing.display_order) || 0,
    }
    const { error: err } = editing.id
      ? await supabase.from('services').update(payload).eq('id', editing.id)
      : await supabase.from('services').insert(payload)
    setSaving(false)
    if (err) {
      setError(`Could not save service: ${err.message}`)
      return
    }
    setEditing(null)
    void load()
  }

  const togglePublish = async (row: Service) => {
    setBusyId(row.id)
    setError('')
    const { error: err } = await supabase.from('services').update({ published: !row.published }).eq('id', row.id)
    if (err) setError(`Could not update: ${err.message}`)
    setBusyId(null)
    void load()
  }

  const toggleFooter = async (row: Service) => {
    setBusyId(row.id)
    setError('')
    const { error: err } = await supabase.from('services').update({ show_in_footer: !row.show_in_footer }).eq('id', row.id)
    if (err) setError(`Could not update footer visibility: ${err.message}`)
    setBusyId(null)
    void load()
  }

  const remove = async (row: Service) => {
    if (!window.confirm(`Move "${row.name}" to trash? It will be permanently deleted after 30 days.`)) return
    setBusyId(row.id)
    setError('')
    const { error: err } = await supabase.from('services').update({ deleted_at: new Date().toISOString() }).eq('id', row.id)
    if (err) setError(`Could not delete: ${err.message}`)
    setBusyId(null)
    void load()
  }

  const restore = async (row: Service) => {
    setBusyId(row.id)
    const { error: err } = await supabase.from('services').update({ deleted_at: null }).eq('id', row.id)
    if (err) setError(`Could not restore: ${err.message}`)
    setBusyId(null)
    void load()
  }

  const move = async (row: Service, dir: -1 | 1) => {
    const idx = rows.findIndex((r) => r.id === row.id)
    const target = rows[idx + dir]
    if (!target) return
    setBusyId(row.id)
    await Promise.all([
      supabase.from('services').update({ display_order: target.display_order }).eq('id', row.id),
      supabase.from('services').update({ display_order: row.display_order }).eq('id', target.id),
    ])
    setBusyId(null)
    void load()
  }

  return (
    <div>
      <PageIntro
        title="Services"
        description="Published services appear on the public Services page in the order below. Trash is kept 30 days."
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowTrash(!showTrash)} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${showTrash ? 'border-navy bg-navy text-white' : 'border-gray-200 bg-white text-ink-light hover:border-navy'}`}>{showTrash ? 'Active' : `Trash`}</button>
            <button onClick={() => setEditing({ ...EMPTY })} className="inline-flex items-center gap-2 rounded-xl bg-brand-green-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-600">
              <Plus size={15} /> Add Service
            </button>
          </div>
        }
      />

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services…" aria-label="Search services" className={`${inputClass} pl-11`} />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Filter by category" className={`${inputClass} sm:w-64`}>
          <option value="all">All categories</option>
          {[...new Set([...CATEGORY_OPTIONS, ...rows.map((r) => r.category).filter(Boolean) as string[]])].map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <Skeletons count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState title={rows.length === 0 ? 'No services yet' : 'No matches'} hint={rows.length === 0 ? 'Add your first service — it appears on /services when published.' : undefined} />
      ) : (
        <ul className="space-y-3">
          {filtered.map((r, i) => (
            <li key={r.id} className="flex items-center gap-4 rounded-[20px] border border-gray-100 bg-white p-4 shadow-soft transition-colors hover:border-navy-100">
              <span className="flex h-14 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-mist">
                {r.image_url ? <img src={r.image_url} alt="" className="h-full w-full object-cover" /> : <span className="font-display text-sm font-bold text-navy-200">{i + 1}</span>}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display font-bold text-navy">{r.name}</p>
                <p className="truncate text-xs text-ink-light">
                  {[r.category, r.short_description].filter(Boolean).join(' · ') || 'No description'}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                <button onClick={() => move(r, -1)} disabled={busyId === r.id || i === 0} aria-label={`Move ${r.name} up`} className="rounded-lg p-2 text-ink-light transition-colors hover:bg-navy-50 hover:text-navy disabled:opacity-25">
                  <ChevronUp size={15} />
                </button>
                <button onClick={() => move(r, 1)} disabled={busyId === r.id || i === rows.length - 1} aria-label={`Move ${r.name} down`} className="rounded-lg p-2 text-ink-light transition-colors hover:bg-navy-50 hover:text-navy disabled:opacity-25">
                  <ChevronDown size={15} />
                </button>
                <button
                  onClick={() => toggleFooter(r)}
                  disabled={busyId === r.id}
                  title={r.show_in_footer ? 'Remove from footer' : 'Show in footer'}
                  aria-label={r.show_in_footer ? `Hide ${r.name} from footer` : `Show ${r.name} in footer`}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ring-1 transition-all ${r.show_in_footer ? 'bg-gold-50 text-gold-600 ring-gold-200' : 'bg-white text-ink-light ring-gray-200 hover:bg-mist'}`}
                >
                  {r.show_in_footer ? 'In footer' : 'Show in footer'}
                </button>
                <button
                  onClick={() => togglePublish(r)}
                  disabled={busyId === r.id}
                  className={`ml-1 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide ring-1 transition-all ${
                    r.published ? 'bg-brand-green-50 text-brand-green-700 ring-brand-green-200' : 'bg-mist text-ink-light ring-gray-200'
                  }`}
                >
                  {r.published ? 'Published' : 'Draft'}
                </button>
                {(r as unknown as { deleted_at: string | null }).deleted_at ? (
                  <button onClick={() => restore(r)} disabled={busyId === r.id} aria-label={`Restore ${r.name}`} className="rounded-lg p-2 text-brand-green-600 hover:bg-green-50">
                    <Undo2 size={15} />
                  </button>
                ) : (
                  <>
                    <button onClick={() => setEditing(r)} aria-label={`Edit ${r.name}`} className="rounded-lg p-2 text-ink-light transition-colors hover:bg-navy-50 hover:text-navy">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(r)} disabled={busyId === r.id} aria-label={`Delete ${r.name}`} className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40">
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Drawer open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? `Edit — ${editing.name}` : 'Add Service'}>
        {editing && (
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Service Name *</span>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g., IT Equipment Procurement" className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Category</span>
              <select value={editing.category ?? ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={inputClass}>
                <option value="">— None —</option>
                {[...new Set([...CATEGORY_OPTIONS, ...(editing.category ? [editing.category] : [])])].map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <ImageUploader value={editing.image_url ?? ''} onChange={(url) => setEditing({ ...editing, image_url: url })} label="Service Image" folder="services" />
            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Short Description</span>
              <textarea rows={2} value={editing.short_description ?? ''} onChange={(e) => setEditing({ ...editing, short_description: e.target.value })} placeholder="Shown on cards and previews" className={`${inputClass} resize-none`} />
            </label>
            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Full Description</span>
              <textarea rows={6} value={editing.full_description ?? ''} onChange={(e) => setEditing({ ...editing, full_description: e.target.value })} placeholder="Complete details…" className={`${inputClass} resize-none`} />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Display Order</span>
                <input type="number" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} className={inputClass} />
              </label>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 bg-mist/50 p-3.5">
                  <input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} className="h-4 w-4 accent-brand-green-500" />
                  <span className="text-sm font-medium text-navy">Published</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5">
                  <input type="checkbox" checked={!!editing.show_in_footer} onChange={(e) => setEditing({ ...editing, show_in_footer: e.target.checked })} className="h-4 w-4 accent-gold-400" />
                  <span className="text-sm font-medium text-navy">Show in footer</span>
                </label>
              </div>
            </div>
            {editing.show_in_footer && (
              <div className="grid gap-4 rounded-2xl border border-gold-100 bg-gold-50/40 p-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Footer Label (optional) — overrides name in footer</span>
                  <input value={editing.footer_label ?? ''} onChange={(e) => setEditing({ ...editing, footer_label: e.target.value })} placeholder={editing.name || 'Custom Procurement'} className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Footer Path (optional) — decides where it opens</span>
                  <input value={editing.footer_path ?? ''} onChange={(e) => setEditing({ ...editing, footer_path: e.target.value })} placeholder="/quote?category=custom-sourcing or /services?highlight=custom-sourcing" className={inputClass} />
                  <span className="mt-1 block text-[11px] text-ink-light">Must start with / when set — e.g., <span className="font-mono">/quote</span></span>
                </label>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-brand-green-500 py-3 font-semibold text-white transition-colors hover:bg-brand-green-600 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save Service'}
              </button>
              <button onClick={() => setEditing(null)} className="rounded-xl border border-gray-200 px-6 py-3 font-semibold text-ink-light transition-colors hover:border-navy hover:text-navy">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
