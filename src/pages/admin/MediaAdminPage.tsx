import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, Undo2, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageIntro } from '@/components/admin/AdminLayout'
import { Drawer, EmptyState, ErrorBanner, Skeletons } from '@/components/admin/bits'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { SITE_IMAGE_SECTIONS, type SiteImage } from '@/lib/siteData'
import { inputClass } from '@/components/ui'
import { useQuerySearch } from '@/components/admin/AdminSearch'

interface Row extends SiteImage {
  deleted_at: string | null
  created_at: string
}

const SECTIONS = [...SITE_IMAGE_SECTIONS, 'custom'] as const

const EMPTY: Row = {
  id: '', section: 'home_hero', url: '', alt_text: '', sort_order: 0, is_active: true, deleted_at: null, created_at: new Date().toISOString(),
}

export default function MediaAdminPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sectionFilter, setSectionFilter] = useState<string>('all')
  const [showTrash, setShowTrash] = useState(false)
  const [search, setSearch] = useQuerySearch()
  const [editing, setEditing] = useState<Row | null>(null)
  const [customSection, setCustomSection] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    const { data, error: err } = await supabase.from('site_images').select('*').order('section').order('sort_order').order('created_at')
    if (err) setError(err.code === '42P01' ? 'Run supabase/migrations/008_site_images_and_media.sql first.' : `Failed to load: ${err.message}`)
    setRows((data as Row[]) ?? []); setLoading(false)
  }, [])

  useEffect(() => { document.title = 'Media Library | GNAB Admin'; void load() }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rows.filter((r) => {
      const isDeleted = !!r.deleted_at
      if (!showTrash && isDeleted) return false
      if (showTrash && !isDeleted) return false
      if (sectionFilter !== 'all' && r.section !== sectionFilter) return false
      if (q && !(`${r.section} ${r.alt_text} ${r.url}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [rows, search, sectionFilter, showTrash])

  const save = async () => {
    if (!editing) return
    const section = editing.section === 'custom' ? customSection.trim() : editing.section.trim()
    if (!section) { setError('Section is required.'); return }
    if (!editing.url.trim()) { setError('Image is required — upload a file or paste a URL.'); return }
    setSaving(true); setError('')
    const payload = {
      section,
      url: editing.url.trim(),
      alt_text: editing.alt_text || null,
      sort_order: Number(editing.sort_order) || 0,
      is_active: editing.is_active,
      deleted_at: null,
    }
    const { error: err } = editing.id ? await supabase.from('site_images').update(payload).eq('id', editing.id) : await supabase.from('site_images').insert(payload)
    setSaving(false)
    if (err) { setError(`Could not save: ${err.message}`); return }
    setEditing(null); setCustomSection(''); void load()
  }

  const softDelete = async (row: Row) => {
    if (!window.confirm(`Move this image to trash? It will be permanently deleted after 30 days.`)) return
    setBusyId(row.id)
    const { error: err } = await supabase.from('site_images').update({ deleted_at: new Date().toISOString() }).eq('id', row.id)
    if (err) setError(`Could not delete: ${err.message}`)
    setBusyId(null); void load()
  }

  const restore = async (row: Row) => {
    setBusyId(row.id)
    const { error: err } = await supabase.from('site_images').update({ deleted_at: null }).eq('id', row.id)
    if (err) setError(`Could not restore: ${err.message}`)
    setBusyId(null); void load()
  }

  const move = async (row: Row, dir: -1 | 1) => {
    const visible = filtered.filter((r) => r.section === row.section && !r.deleted_at).sort((a,b)=>a.sort_order-b.sort_order)
    const idx = visible.findIndex((r)=>r.id===row.id)
    const target = visible[idx+dir]
    if (!target) return
    setBusyId(row.id)
    await Promise.all([
      supabase.from('site_images').update({ sort_order: target.sort_order }).eq('id', row.id),
      supabase.from('site_images').update({ sort_order: row.sort_order }).eq('id', target.id),
    ])
    setBusyId(null); void load()
  }

  const toggleActive = async (row: Row) => {
    setBusyId(row.id)
    const { error: err } = await supabase.from('site_images').update({ is_active: !row.is_active }).eq('id', row.id)
    if (err) setError(`Could not update: ${err.message}`)
    setBusyId(null); void load()
  }

  const sectionsCount = useMemo(() => {
    const m = new Map<string, number>()
    rows.filter((r)=>!r.deleted_at).forEach((r)=> m.set(r.section, (m.get(r.section) ?? 0)+1))
    return m
  }, [rows])

  return (
    <div>
      <PageIntro
        title="Media Library"
        description="Control every image on the public site. Choose where it appears (section), upload a file or paste a URL — changes appear instantly. Trash is kept 30 days."
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowTrash(!showTrash)} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${showTrash ? 'border-navy bg-navy text-white' : 'border-gray-200 bg-white text-ink-light hover:border-navy'}`}>{showTrash ? 'Active' : `Trash (${rows.filter((r)=>r.deleted_at).length})`}</button>
            <button onClick={() => { setEditing({ ...EMPTY }); setCustomSection('') }} className="inline-flex items-center gap-2 rounded-xl bg-brand-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600"><Plus size={15}/> Add Image</button>
          </div>
        }
      />

      <ErrorBanner message={error} onDismiss={()=>setError('')} />

      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_220px]">
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search by section, alt text or URL…" aria-label="Search media" className={inputClass} />
        <select value={sectionFilter} onChange={(e)=>setSectionFilter(e.target.value)} aria-label="Filter by section" className={inputClass}>
          <option value="all">All sections ({rows.filter((r)=>!r.deleted_at).length})</option>
          {[...sectionsCount.keys()].sort().map((s)=> <option key={s} value={s}>{s} ({sectionsCount.get(s)})</option>)}
          {SITE_IMAGE_SECTIONS.filter((s)=>!sectionsCount.has(s)).map((s)=> <option key={s} value={s}>{s} (0)</option>)}
        </select>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {SITE_IMAGE_SECTIONS.map((s)=>(
          <span key={s} className={`rounded-full px-3 py-1 text-xs font-semibold ${sectionsCount.has(s) ? 'bg-navy text-white' : 'bg-mist text-ink-light ring-1 ring-gray-200'}`}>{s}</span>
        ))}
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-light ring-1 ring-gray-200">custom section supported</span>
      </div>

      {loading ? <Skeletons count={6}/> : filtered.length===0 ? (
        <EmptyState title={showTrash ? 'Trash is empty' : 'No images yet'} hint={showTrash ? 'Deleted images are kept for 30 days.' : 'Add your first image — choose a section like home_hero and upload a file or paste a URL.'} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r)=>(
            <div key={r.id} className={`group overflow-hidden rounded-[24px] border bg-white shadow-soft ${r.deleted_at ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'}`}>
              <div className="relative aspect-[16/10] overflow-hidden bg-mist">
                <img src={r.url} alt={r.alt_text ?? ''} className="h-full w-full object-cover" loading="lazy" />
                {!r.is_active && !r.deleted_at && <span className="absolute left-3 top-3 rounded-full bg-mist px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-light ring-1 ring-gray-200">Disabled</span>}
                {r.deleted_at && <span className="absolute left-3 top-3 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">Trash — {new Date(r.deleted_at).toLocaleDateString()}</span>}
                <span className="absolute right-3 top-3 rounded-full bg-navy/85 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur">{r.section}</span>
              </div>
              <div className="p-4">
                <p className="truncate text-xs font-medium text-ink-light">{r.alt_text || 'No alt text'}</p>
                <p className="mt-1 truncate font-mono text-[11px] text-gray-400">{r.url}</p>
                <p className="mt-1 text-xs text-ink-light">Order: {r.sort_order} · {r.is_active ? 'Active' : 'Hidden from site'}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {!r.deleted_at ? (
                    <>
                      <button onClick={()=>move(r,-1)} disabled={busyId===r.id} className="rounded-lg p-2 text-ink-light hover:bg-navy-50 disabled:opacity-25" aria-label="Move up" aria-controls="admin-list"><ChevronUp size={14}/></button>
                      <button onClick={()=>move(r,1)} disabled={busyId===r.id} className="rounded-lg p-2 text-ink-light hover:bg-navy-50 disabled:opacity-25" aria-label="Move down" aria-controls="admin-list"><ChevronDown size={14}/></button>
                      <button onClick={()=>toggleActive(r)} disabled={busyId===r.id} className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ring-1 ${r.is_active ? 'bg-brand-green-50 text-brand-green-700 ring-brand-green-200' : 'bg-mist text-ink-light ring-gray-200'}`}>{r.is_active ? 'Active' : 'Hidden'}</button>
                      <button onClick={()=>{ setEditing(r); setCustomSection(SECTIONS.includes(r.section as typeof SECTIONS[number]) ? '' : r.section)}} className="rounded-lg p-2 text-ink-light hover:bg-navy-50" aria-label="Edit"><Pencil size={14}/></button>
                      <button onClick={()=>softDelete(r)} disabled={busyId===r.id} className="rounded-lg p-2 text-red-400 hover:bg-red-50" aria-label="Delete"><Trash2 size={14}/></button>
                    </>
                  ) : (
                    <><span className="text-xs text-amber-700">Will be permanently deleted after 30 days</span><button onClick={()=>restore(r)} disabled={busyId===r.id} className="ml-auto rounded-lg p-2 text-brand-green-600 hover:bg-green-50" aria-label="Restore"><Undo2 size={14}/></button></>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer open={!!editing} onClose={()=>setEditing(null)} title={editing?.id ? 'Edit Image' : 'Add Image'} subtitle="Upload a file or paste a URL — either works. Choose the section where it should appear.">
        {editing && (
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Section / Placement *</span>
              <select value={SECTIONS.includes(editing.section as typeof SECTIONS[number]) ? editing.section : 'custom'} onChange={(e)=>setEditing({...editing, section: e.target.value})} className={inputClass}>
                {SITE_IMAGE_SECTIONS.map((s)=><option key={s} value={s}>{s}</option>)}
                <option value="custom">Custom…</option>
              </select>
            </label>
            {editing.section === 'custom' && (
              <label className="block">
                <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Custom Section Name *</span>
                <input value={customSection} onChange={(e)=>setCustomSection(e.target.value)} placeholder="e.g., home_stats_bg" className={inputClass} />
                <p className="mt-1 text-xs text-ink-light">Use a unique key like home_hero, home_about, etc. Images appear where that key is used.</p>
              </label>
            )}

            <ImageUploader value={editing.url} onChange={(url)=>setEditing({...editing, url})} label="Image (upload file or paste URL)" folder={editing.section === 'custom' ? (customSection || 'custom') : editing.section} />

            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Alt Text</span>
              <input value={editing.alt_text ?? ''} onChange={(e)=>setEditing({...editing, alt_text: e.target.value})} placeholder="Describe the image for accessibility…" className={inputClass} />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block"><span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Sort Order</span><input type="number" value={editing.sort_order} onChange={(e)=>setEditing({...editing, sort_order: Number(e.target.value)})} className={inputClass} /></label>
              <label className="mt-7 flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 bg-mist/50 p-3.5">
                <input type="checkbox" checked={editing.is_active} onChange={(e)=>setEditing({...editing, is_active: e.target.checked})} className="h-4 w-4 accent-brand-green-500" />
                <span className="text-sm font-medium text-navy">Active (show on site)</span>
              </label>
            </div>

            <div className="rounded-2xl border border-navy-100 bg-navy-50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-navy"><ImageIcon size={14}/> How placement works</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-ink-light">
                <li><code>home_hero</code> — carousel on homepage (multiple images rotate)</li>
                <li><code>home_about</code> + <code>home_about_overlay</code> — two images in the “Who We Are” section</li>
                <li><code>home_cta</code> — banner at the bottom of the homepage</li>
                <li><code>about_hero</code>, <code>about_warehouse</code> — About page</li>
                <li><code>services_hero</code>, <code>industries_hero</code>, <code>why_hero</code>, <code>process_hero</code>, <code>contact_hero</code>, <code>blog_hero</code> — hero backgrounds per page</li>
                <li>Any product/service/process/blog image is managed on its own page — this library is for site-wide placement images.</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-brand-green-500 py-3 font-semibold text-white hover:bg-brand-green-600 disabled:opacity-60">{saving?'Saving…':'Save Image'}</button>
              <button onClick={()=>setEditing(null)} className="rounded-xl border border-gray-200 px-6 py-3 font-semibold text-ink-light hover:border-navy">Cancel</button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
