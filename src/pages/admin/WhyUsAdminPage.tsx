import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, Undo2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageIntro } from '@/components/admin/AdminLayout'
import { Drawer, EmptyState, ErrorBanner, Skeletons } from '@/components/admin/bits'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { ICON_OPTIONS } from '@/lib/iconOptions'
import { inputClass } from '@/components/ui'
import { useQuerySearch } from '@/components/admin/AdminSearch'

interface Row {
  id: string
  title: string
  description: string | null
  icon: string | null
  image_url: string | null
  display_order: number
  published: boolean
  deleted_at: string | null
}

const EMPTY: Row = { id: '', title: '', description: '', icon: 'Handshake', image_url: '', display_order: 0, published: true, deleted_at: null }

export default function WhyUsAdminPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showTrash, setShowTrash] = useState(false)
  const [search, setSearch] = useQuerySearch()
  const [editing, setEditing] = useState<Row | null>(null)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    const { data, error: err } = await supabase.from('why_choose_us').select('*').order('display_order').order('created_at')
    if (err) setError(err.code === '42P01' ? 'Run 007_full_cms_and_retention.sql first.' : `Failed to load: ${err.message}`)
    setRows((data as Row[]) ?? []); setLoading(false)
  }, [])
  useEffect(() => { document.title = 'Why Us | GNAB Admin'; void load() }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rows.filter((r) => {
      const isDeleted = !!r.deleted_at
      if (!showTrash && isDeleted) return false
      if (showTrash && !isDeleted) return false
      if (q && !r.title.toLowerCase().includes(q)) return false
      return true
    })
  }, [rows, search, showTrash])

  const save = async () => {
    if (!editing || !editing.title.trim()) { setError('Title is required.'); return }
    setSaving(true); setError('')
    const payload = { title: editing.title.trim(), description: editing.description || null, icon: editing.icon || null, image_url: editing.image_url || null, published: editing.published, display_order: Number(editing.display_order) || 0, deleted_at: null }
    const { error: err } = editing.id ? await supabase.from('why_choose_us').update(payload).eq('id', editing.id) : await supabase.from('why_choose_us').insert(payload)
    setSaving(false); if (err) { setError(`Could not save: ${err.message}`); return }
    setEditing(null); void load()
  }

  const softDelete = async (row: Row) => {
    if (!window.confirm(`Move "${row.title}" to trash? It will be permanently deleted after 30 days.`)) return
    setBusyId(row.id); const { error: err } = await supabase.from('why_choose_us').update({ deleted_at: new Date().toISOString() }).eq('id', row.id)
    if (err) setError(`Could not delete: ${err.message}`); setBusyId(null); void load()
  }
  const restore = async (row: Row) => { setBusyId(row.id); const { error: err } = await supabase.from('why_choose_us').update({ deleted_at: null }).eq('id', row.id); if (err) setError(`Could not restore: ${err.message}`); setBusyId(null); void load() }
  const move = async (row: Row, dir: -1 | 1) => {
    const visibles = filtered.filter((r) => !r.deleted_at)
    const idx = visibles.findIndex((r) => r.id === row.id); const target = visibles[idx + dir]; if (!target) return
    setBusyId(row.id); await Promise.all([ supabase.from('why_choose_us').update({ display_order: target.display_order }).eq('id', row.id), supabase.from('why_choose_us').update({ display_order: row.display_order }).eq('id', target.id) ]); setBusyId(null); void load()
  }

  return (
    <div>
      <PageIntro title="Why Choose Us" description="Feature cards on Home and /why-us. Trash keeps items 30 days." action={
        <div className="flex gap-2">
          <button onClick={() => setShowTrash(!showTrash)} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${showTrash ? 'border-navy bg-navy text-white' : 'border-gray-200 bg-white text-ink-light hover:border-navy'}`}>{showTrash ? 'Active' : `Trash (${rows.filter((r)=>r.deleted_at).length})`}</button>
          <button onClick={() => setEditing({ ...EMPTY })} className="inline-flex items-center gap-2 rounded-xl bg-brand-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600"><Plus size={15}/> Add Card</button>
        </div>
      }/>
      <ErrorBanner message={error} onDismiss={()=>setError('')} />
      <div className="mb-5"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search why-us…" aria-label="Search why-us" className={inputClass} /></div>
      {loading ? <Skeletons count={6}/> : filtered.length===0 ? <EmptyState title={showTrash?'Trash is empty':'No cards yet'} hint={showTrash ? 'Deleted cards are kept for 30 days.' : 'Add your first card — it appears when published.'}/> : (
        <ul className="space-y-3">
          {filtered.map((r,i)=>(
            <li key={r.id} className={`flex items-center gap-4 rounded-[20px] border p-4 shadow-soft ${r.deleted_at?'border-amber-200 bg-amber-50/50':'border-gray-100 bg-white hover:border-navy-100'}`}>
              <div className="min-w-0 flex-1"><p className="truncate font-display font-bold text-navy">{r.title}</p><p className="truncate text-xs text-ink-light">{r.description || 'No description'} · {r.icon ?? '—'}</p></div>
              <div className="flex flex-shrink-0 items-center gap-1">
                {!r.deleted_at ? (
                  <>
                    <button onClick={()=>move(r,-1)} disabled={busyId===r.id||i===0} className="rounded-lg p-2 text-ink-light hover:bg-navy-50 disabled:opacity-25"><ChevronUp size={15}/></button>
                    <button onClick={()=>move(r,1)} disabled={busyId===r.id||i===filtered.length-1} className="rounded-lg p-2 text-ink-light hover:bg-navy-50 disabled:opacity-25"><ChevronDown size={15}/></button>
                    <button onClick={()=>supabase.from('why_choose_us').update({published:!r.published}).eq('id',r.id).then(()=>load())} disabled={busyId===r.id} className={`ml-1 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${r.published?'bg-brand-green-50 text-brand-green-700 ring-brand-green-200':'bg-mist text-ink-light ring-gray-200'}`}>{r.published?'Published':'Draft'}</button>
                    <button onClick={()=>setEditing(r)} className="rounded-lg p-2 text-ink-light hover:bg-navy-50"><Pencil size={15}/></button>
                    <button onClick={()=>softDelete(r)} disabled={busyId===r.id} className="rounded-lg p-2 text-red-400 hover:bg-red-50"><Trash2 size={15}/></button>
                  </>
                ) : (
                  <><span className="text-xs text-amber-700">Trash — {new Date(r.deleted_at!).toLocaleDateString()}</span><button onClick={()=>restore(r)} disabled={busyId===r.id} className="rounded-lg p-2 text-brand-green-600 hover:bg-green-50"><Undo2 size={15}/></button></>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Drawer open={!!editing} onClose={()=>setEditing(null)} title={editing?.id ? `Edit — ${editing.title}` : 'Add Card'}>
        {editing && (
          <div className="space-y-5">
            <label className="block"><span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Title *</span><input value={editing.title} onChange={(e)=>setEditing({...editing,title:e.target.value})} placeholder="e.g., Reliable Supplier Network" className={inputClass}/></label>
            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Icon — 40+ options</span>
              <div className="grid max-h-48 grid-cols-6 gap-2 overflow-y-auto rounded-xl border border-gray-200 bg-mist/30 p-3">
                {ICON_OPTIONS.map((opt) => {
                  const ActiveIcon = opt.icon
                  const selected = editing.icon === opt.name
                  return (
                    <button key={opt.name} type="button" onClick={() => setEditing({ ...editing, icon: opt.name })} title={opt.label} className={`flex flex-col items-center gap-1 rounded-xl p-2 text-[10px] font-medium transition-all ${selected ? 'bg-navy text-white shadow' : 'bg-white text-ink-light hover:bg-navy-50 hover:text-navy'}`}>
                      <ActiveIcon size={18} />
                      <span className="truncate text-[9px] leading-none">{opt.name}</span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 text-xs text-ink-light">Selected: <span className="font-semibold text-navy">{editing.icon || '— None —'}</span> <button type="button" onClick={() => setEditing({ ...editing, icon: '' })} className="ml-2 text-brand-green-600 hover:underline">Clear</button></p>
            </label>
            <label className="block"><span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Description</span><textarea rows={4} value={editing.description ?? ''} onChange={(e)=>setEditing({...editing,description:e.target.value})} placeholder="Short description shown on cards…" className={`${inputClass} resize-none`}/></label>
            <ImageUploader value={editing.image_url ?? ''} onChange={(url)=>setEditing({...editing, image_url: url})} label="Card Image (upload or paste URL)" folder="why-us" />
            <div className="grid grid-cols-2 gap-4">
              <label className="block"><span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Display Order</span><input type="number" value={editing.display_order} onChange={(e)=>setEditing({...editing,display_order:Number(e.target.value)})} className={inputClass}/></label>
              <label className="mt-7 flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 bg-mist/50 p-3.5"><input type="checkbox" checked={editing.published} onChange={(e)=>setEditing({...editing,published:e.target.checked})} className="h-4 w-4 accent-brand-green-500"/><span className="text-sm font-medium text-navy">Published</span></label>
            </div>
            <div className="flex gap-3 pt-2"><button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-brand-green-500 py-3 font-semibold text-white hover:bg-brand-green-600 disabled:opacity-60">{saving?'Saving…':'Save Card'}</button><button onClick={()=>setEditing(null)} className="rounded-xl border border-gray-200 px-6 py-3 font-semibold text-ink-light hover:border-navy">Cancel</button></div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
