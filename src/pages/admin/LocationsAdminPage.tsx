import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, MapPin, Pencil, Plus, Trash2, Undo2, ExternalLink, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageIntro } from '@/components/admin/AdminLayout'
import { Drawer, EmptyState, ErrorBanner, Skeletons } from '@/components/admin/bits'
import { inputClass } from '@/components/ui'
import { useQuerySearch } from '@/components/admin/AdminSearch'

interface Row {
  id: string
  name: string
  address: string
  latitude: number | null
  longitude: number | null
  google_maps_url: string | null
  is_primary: boolean
  sort_order: number
  is_active: boolean
  deleted_at: string | null
  created_at: string
}

const EMPTY: Row = {
  id: '',
  name: '',
  address: '',
  latitude: null,
  longitude: null,
  google_maps_url: '',
  is_primary: false,
  sort_order: 0,
  is_active: true,
  deleted_at: null,
  created_at: new Date().toISOString(),
}

function extractLatLng(url: string): { lat: number; lng: number } | null {
  if (!url) return null
  let m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (m) return { lat: parseFloat(m[1]!), lng: parseFloat(m[2]!) }
  m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
  if (m) return { lat: parseFloat(m[1]!), lng: parseFloat(m[2]!) }
  m = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (m) return { lat: parseFloat(m[1]!), lng: parseFloat(m[2]!) }
  m = url.match(/\/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (m) return { lat: parseFloat(m[1]!), lng: parseFloat(m[2]!) }
  m = url.match(/(-?\d+\.\d+)%2C(-?\d+\.\d+)/)
  if (m) return { lat: parseFloat(m[1]!), lng: parseFloat(m[2]!) }
  return null
}

function osmPreviewUrl(lat: number, lng: number): string {
  const d = 0.008
  const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
}

export default function LocationsAdminPage() {
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
    const { data, error: err } = await supabase.from('locations').select('*').order('sort_order').order('created_at')
    if (err) setError(err.code === '42P01' ? 'Run supabase/migrations/012_business_locations.sql first.' : `Failed to load: ${err.message}`)
    setRows((data as Row[]) ?? []); setLoading(false)
  }, [])

  useEffect(() => { document.title = 'Locations | GNAB Admin'; void load() }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rows.filter((r) => {
      const isDeleted = !!r.deleted_at
      if (!showTrash && isDeleted) return false
      if (showTrash && !isDeleted) return false
      if (q && !(`${r.name} ${r.address}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [rows, search, showTrash])

  const save = async () => {
    if (!editing || !editing.name.trim() || !editing.address.trim()) { setError('Name and address are required.'); return }
    if (editing.latitude !== null && (editing.latitude < -90 || editing.latitude > 90)) { setError('Latitude must be between -90 and 90.'); return }
    if (editing.longitude !== null && (editing.longitude < -180 || editing.longitude > 180)) { setError('Longitude must be between -180 and 180.'); return }
    setSaving(true); setError('')
    const payload = {
      name: editing.name.trim(),
      address: editing.address.trim(),
      latitude: editing.latitude,
      longitude: editing.longitude,
      google_maps_url: editing.google_maps_url || null,
      is_primary: editing.is_primary,
      sort_order: Number(editing.sort_order) || 0,
      is_active: editing.is_active,
      deleted_at: null,
    }
    const { error: err } = editing.id ? await supabase.from('locations').update(payload).eq('id', editing.id) : await supabase.from('locations').insert(payload)
    setSaving(false)
    if (err) { setError(`Could not save: ${err.message}`); return }
    setEditing(null); void load()
  }

  const softDelete = async (row: Row) => {
    if (!window.confirm(`Move "${row.name}" to trash? It will be permanently deleted after 30 days.`)) return
    setBusyId(row.id)
    const { error: err } = await supabase.from('locations').update({ deleted_at: new Date().toISOString() }).eq('id', row.id)
    if (err) setError(`Could not delete: ${err.message}`)
    setBusyId(null); void load()
  }

  const restore = async (row: Row) => {
    setBusyId(row.id)
    const { error: err } = await supabase.from('locations').update({ deleted_at: null }).eq('id', row.id)
    if (err) setError(`Could not restore: ${err.message}`)
    setBusyId(null); void load()
  }

  const move = async (row: Row, dir: -1 | 1) => {
    const visibles = filtered.filter((r) => !r.deleted_at)
    const idx = visibles.findIndex((r) => r.id === row.id)
    const target = visibles[idx + dir]
    if (!target) return
    setBusyId(row.id)
    await Promise.all([
      supabase.from('locations').update({ sort_order: target.sort_order }).eq('id', row.id),
      supabase.from('locations').update({ sort_order: row.sort_order }).eq('id', target.id),
    ])
    setBusyId(null); void load()
  }

  const tryExtract = () => {
    if (!editing) return
    const url = editing.google_maps_url ?? ''
    const coords = extractLatLng(url)
    if (!coords) { setError('Could not extract coordinates from that URL. Paste a Google Maps link that contains @lat,lng or !3d/!4d, or enter lat/lng manually.'); return }
    setEditing({ ...editing, latitude: coords.lat, longitude: coords.lng })
    setError('')
  }

  return (
    <div>
      <PageIntro
        title="Business Locations"
        description="Add every physical location. All active locations appear as pins on the Contact page interactive map. Trash is kept 30 days."
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowTrash(!showTrash)} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${showTrash ? 'border-navy bg-navy text-white' : 'border-gray-200 bg-white text-ink-light hover:border-navy'}`}>{showTrash ? 'Active' : `Trash (${rows.filter((r)=>r.deleted_at).length})`}</button>
            <button onClick={() => setEditing({ ...EMPTY })} className="inline-flex items-center gap-2 rounded-xl bg-brand-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600"><Plus size={15}/> Add Location</button>
          </div>
        }
      />

      <ErrorBanner message={error} onDismiss={()=>setError('')} />

      <div className="mb-5">
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search locations…" aria-label="Search locations" className={inputClass} />
      </div>

      {loading ? <Skeletons count={4}/> : filtered.length===0 ? (
        <EmptyState title={showTrash ? 'Trash is empty' : rows.length===0 ? 'No locations yet' : 'No matches'} hint={showTrash ? 'Deleted locations are kept for 30 days.' : 'Add your head office and branches — they will all show on the Contact map.'} />
      ) : (
        <ul className="space-y-3">
          {filtered.map((r,i)=>(
            <li key={r.id} className={`flex gap-4 rounded-[20px] border p-4 shadow-soft ${r.deleted_at ? 'border-amber-200 bg-amber-50/50' : r.is_primary ? 'border-gold-200 bg-gold-50/30' : 'border-gray-100 bg-white'}`}>
              <span className={`hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl sm:flex ${r.is_primary ? 'bg-gold-400 text-navy' : 'bg-navy-50 text-navy'}`}>
                <MapPin size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-display font-bold text-navy">{r.name}</p>
                  {r.is_primary && <span className="inline-flex items-center gap-1 rounded-full bg-gold-400 px-2.5 py-0.5 text-[11px] font-bold text-navy"><Star size={11}/> Primary</span>}
                  {!r.is_active && !r.deleted_at && <span className="rounded-full bg-mist px-2.5 py-0.5 text-[11px] font-bold uppercase text-ink-light ring-1 ring-gray-200">Hidden</span>}
                  {r.deleted_at && <span className="text-xs text-amber-700">Trash — {new Date(r.deleted_at).toLocaleDateString()}</span>}
                </div>
                <p className="mt-1 truncate text-sm text-ink-light">{r.address}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {r.latitude !== null && r.longitude !== null ? `${r.latitude.toFixed(5)}, ${r.longitude.toFixed(5)}` : 'No coordinates — map pin will not show'}
                  {r.google_maps_url ? <> · <a href={r.google_maps_url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-green-600 hover:underline">Google Maps <ExternalLink size={11} className="inline" /></a></> : ''}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                {!r.deleted_at ? (
                  <>
                    <button onClick={()=>move(r,-1)} disabled={busyId===r.id||i===0} className="rounded-lg p-2 text-ink-light hover:bg-navy-50 disabled:opacity-25"><ChevronUp size={15}/></button>
                    <button onClick={()=>move(r,1)} disabled={busyId===r.id||i===filtered.length-1} className="rounded-lg p-2 text-ink-light hover:bg-navy-50 disabled:opacity-25"><ChevronDown size={15}/></button>
                    <button onClick={()=>setEditing(r)} className="rounded-lg p-2 text-ink-light hover:bg-navy-50"><Pencil size={15}/></button>
                    <button onClick={()=>softDelete(r)} disabled={busyId===r.id} className="rounded-lg p-2 text-red-400 hover:bg-red-50"><Trash2 size={15}/></button>
                  </>
                ) : (
                  <button onClick={()=>restore(r)} disabled={busyId===r.id} className="rounded-lg p-2 text-brand-green-600 hover:bg-green-50"><Undo2 size={15}/></button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Drawer open={!!editing} onClose={()=>setEditing(null)} title={editing?.id ? `Edit — ${editing.name}` : 'Add Location'} subtitle="Pins appear on the Contact page map in sort order. The primary pin is highlighted.">
        {editing && (
          <div className="space-y-5">
            <label className="block"><span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Location Name *</span><input value={editing.name} onChange={(e)=>setEditing({...editing, name:e.target.value})} placeholder="e.g., Head Office, Tema Branch" className={inputClass}/></label>
            <label className="block"><span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Address *</span><textarea rows={2} value={editing.address} onChange={(e)=>setEditing({...editing, address:e.target.value})} placeholder="Full street address as shown on site" className={`${inputClass} resize-none`}/></label>

            <div className="rounded-2xl border border-navy-100 bg-navy-50 p-4">
              <p className="text-sm font-semibold text-navy">Coordinates for map pin</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-light">Paste a Google Maps link and click Extract, or enter latitude/longitude manually. Without coordinates the location will show in the list but not as a pin.</p>
              <label className="mt-3 block"><span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Google Maps URL (optional)</span><input value={editing.google_maps_url ?? ''} onChange={(e)=>setEditing({...editing, google_maps_url:e.target.value})} placeholder="https://www.google.com/maps/place/.../@5.60,-0.19... or https://goo.gl/maps/..." className={inputClass}/></label>
              <button type="button" onClick={tryExtract} className="mt-2 rounded-xl border border-navy bg-white px-4 py-2 text-xs font-semibold text-navy hover:bg-navy-50">Extract coordinates from URL</button>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Latitude</span><input type="number" step="any" value={editing.latitude ?? ''} onChange={(e)=>setEditing({...editing, latitude: e.target.value === '' ? null : Number(e.target.value)})} placeholder="5.6037" className={inputClass}/></label>
                <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Longitude</span><input type="number" step="any" value={editing.longitude ?? ''} onChange={(e)=>setEditing({...editing, longitude: e.target.value === '' ? null : Number(e.target.value)})} placeholder="-0.1870" className={inputClass}/></label>
              </div>
              {editing.latitude !== null && editing.longitude !== null && (
                <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                  <iframe title="Preview" src={osmPreviewUrl(editing.latitude, editing.longitude)} className="h-48 w-full border-0" loading="lazy" />
                  <p className="bg-white px-3 py-2 text-center text-xs text-ink-light">Preview — pin at {editing.latitude.toFixed(5)}, {editing.longitude.toFixed(5)}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="block"><span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Sort Order</span><input type="number" value={editing.sort_order} onChange={(e)=>setEditing({...editing, sort_order:Number(e.target.value)})} className={inputClass}/></label>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 bg-mist/50 p-3.5"><input type="checkbox" checked={editing.is_primary} onChange={(e)=>setEditing({...editing, is_primary:e.target.checked})} className="h-4 w-4 accent-gold-400"/><span className="text-sm font-medium text-navy">Primary location</span></label>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 bg-mist/50 p-3"><input type="checkbox" checked={editing.is_active} onChange={(e)=>setEditing({...editing, is_active:e.target.checked})} className="h-4 w-4 accent-brand-green-500"/><span className="text-sm font-medium text-navy">Active (show on map)</span></label>
              </div>
            </div>

            <div className="flex gap-3 pt-2"><button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-brand-green-500 py-3 font-semibold text-white hover:bg-brand-green-600 disabled:opacity-60">{saving?'Saving…':'Save Location'}</button><button onClick={()=>setEditing(null)} className="rounded-xl border border-gray-200 px-6 py-3 font-semibold text-ink-light hover:border-navy">Cancel</button></div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
