import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageIntro } from '@/components/admin/AdminLayout'
import { Drawer, ErrorBanner, Skeletons } from '@/components/admin/bits'
import { CtaDesignCard, HomeHeroDesignCard } from '@/components/admin/DesignControls'
import { inputClass } from '@/components/ui'
import { ICON_OPTIONS } from '@/lib/iconOptions'

// Types
type Tab = 'hero' | 'trust' | 'about' | 'services' | 'industries' | 'why' | 'process' | 'stats' | 'cta'

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: 'hero', label: 'Hero', hint: 'Badge, headline, buttons & mini-stats' },
  { id: 'trust', label: 'Trust Bar', hint: 'Feature cards under hero' },
  { id: 'about', label: 'About Preview', hint: 'Image, badge & paragraphs' },
  { id: 'services', label: 'Services', hint: 'Cards shown on Home' },
  { id: 'industries', label: 'Industries', hint: 'Who we serve grid' },
  { id: 'why', label: 'Why Choose Us', hint: 'Feature cards' },
  { id: 'process', label: 'Process', hint: '6-step journey' },
  { id: 'stats', label: 'Stats', hint: 'Numbers strip' },
  { id: 'cta', label: 'CTA', hint: 'Premium bottom card' },
]

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
      {ICON_OPTIONS.map((o) => <option key={o.name} value={o.name}>{o.label} ({o.name})</option>)}
    </select>
  )
}

// Fallbacks mirror exactly what HomePage shows when DB is empty
const FALLBACK_HERO = {
  badge: 'Welcome to GNAB Business Solutions',
  title_prefix: 'Your Trusted',
  title_highlight: 'Procurement & Supply',
  title_suffix: 'Partner',
  subtitle: 'We simplify procurement through reliable sourcing, competitive pricing and timely delivery — across Ghana and beyond.',
  primary_label: 'Request a Quote',
  primary_link: '/quote',
  secondary_label: 'Explore Our Services',
  secondary_link: '/services',
}
const FALLBACK_TRUST = [
  { icon: 'ShieldCheck', label: 'Reliable Procurement' },
  { icon: 'Wallet', label: 'Competitive Pricing' },
  { icon: 'PackageCheck', label: 'Quality Assurance' },
  { icon: 'Truck', label: 'Timely Delivery' },
  { icon: 'Handshake', label: 'Trusted Supplier Network' },
]
const FALLBACK_ABOUT = {
  eyebrow: 'About Us',
  title_prefix: 'Who We',
  title_highlight: 'Are',
  paragraph1: 'GNAB Business Solutions is a trusted procurement and supply partner providing organizations with a single point of contact for sourcing, purchasing and delivering quality products across multiple industries.',
  paragraph2: 'From office stationery to industrial equipment, we handle it all with professionalism and efficiency — so your business never stops running.',
  badge_value: '10+',
  badge_label: 'Years of Excellence',
  phone: '+233 55 427 3445',
  phone_label: 'Speak to our team',
  primary_label: 'Learn More About Us',
  primary_link: '/about',
  image_url: '',
  overlay_url: '',
}
const FALLBACK_STATS = [
  { value: 100, suffix: '+', label: 'Supplier Network' },
  { value: 500, suffix: '+', label: 'Products Available' },
  { value: 24, suffix: 'h', label: 'Quotation Response' },
  { value: 100, suffix: '%', label: 'Customer Commitment' },
]
const FALLBACK_CTA = {
  eyebrow: "Let's talk",
  title_prefix: 'Ready to Simplify',
  title_highlight: 'Your Procurement?',
  subtitle: 'Let GNAB handle your sourcing, pricing and delivery — one partner, endless solutions. Your free quotation lands within 24 hours.',
  primary_label: 'Request a Quote',
  primary_link: '/quote',
  secondary_label: 'Contact Our Team',
  secondary_link: '/contact',
  feature1: '24h response',
  feature2: '100% commitment',
  feature3: 'No obligation until you approve',
  bg_image_url: '',
}

// ── Hero ──
function HeroTab() {
  const [row, setRow] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState(false)
  const [isFallback, setIsFallback] = useState(false)
  const load = useCallback(async () => {
    setLoading(true); setErr('')
    const { data, error } = await supabase.from('home_hero').select('*').limit(1).maybeSingle()
    if (error && (error as any).code === '42P01') {
      setErr('Table home_hero not found — run supabase/migrations/016_home_cms.sql in Supabase SQL Editor, then reload. Showing live Home fallback below.')
      setRow({ ...FALLBACK_HERO }); setIsFallback(true)
    } else if (data) {
      setRow(data); setIsFallback(false)
    } else {
      // No row yet — show exactly what Home displays
      setRow({ ...FALLBACK_HERO }); setIsFallback(true)
    }
    setLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])
  const save = async () => {
    setSaving(true); setErr(''); setOk(false)
    const payload = { badge: row.badge, title_prefix: row.title_prefix, title_highlight: row.title_highlight, title_suffix: row.title_suffix, subtitle: row.subtitle, primary_label: row.primary_label, primary_link: row.primary_link, secondary_label: row.secondary_label, secondary_link: row.secondary_link, published: true }
    const { error, data } = row.id ? await supabase.from('home_hero').update(payload).eq('id', row.id).select().maybeSingle() : await supabase.from('home_hero').insert(payload).select().maybeSingle()
    setSaving(false)
    if (error) setErr(error.message); else { setOk(true); if (data) setRow(data); setIsFallback(false); setTimeout(() => setOk(false), 2500) }
  }
  if (loading) return <Skeletons count={3} />
  return (
    <div className="space-y-5">
      <ErrorBanner message={err} onDismiss={() => setErr('')} />
      {isFallback && <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700 ring-1 ring-amber-200">Showing current Home content (fallback). Edit and Save to create the live database record — Home will then read from it.</p>}
      {[
        ['Badge', 'badge'],
        ['Title prefix', 'title_prefix'],
        ['Title highlight (gold)', 'title_highlight'],
        ['Title suffix', 'title_suffix'],
        ['Subtitle', 'subtitle', true],
        ['Primary button label', 'primary_label'],
        ['Primary button link', 'primary_link'],
        ['Secondary button label', 'secondary_label'],
        ['Secondary button link', 'secondary_link'],
      ].map(([label, key, isArea]) => (
        <label key={String(key)} className="block">
          <span className="mb-1.5 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">{label}</span>
          {isArea ? <textarea rows={3} value={row[String(key)] ?? ''} onChange={(e) => setRow({ ...row, [String(key)]: e.target.value })} className={`${inputClass} resize-none`} /> : <input value={row[String(key)] ?? ''} onChange={(e) => setRow({ ...row, [String(key)]: e.target.value })} className={inputClass} />}
        </label>
      ))}
      <p className="text-xs text-ink-light">Mini-stats under hero are auto-derived from Stats tab. Hero images are managed in <span className="font-semibold">Admin → Media → home_hero</span>.</p>
      <HomeHeroDesignCard />
      <button onClick={() => void save()} disabled={saving} className="rounded-xl bg-brand-green-500 px-6 py-3 font-semibold text-white hover:bg-brand-green-600 disabled:opacity-60">{saving ? 'Saving…' : ok ? 'Saved — Home updated!' : 'Save Hero'}</button>
    </div>
  )
}

// ── Trust ──
function TrustTab() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const load = useCallback(async () => {
    setLoading(true); setErr('')
    const { data, error } = await supabase.from('home_trust_items').select('*').order('display_order').order('created_at')
    if (error && (error as any).code === '42P01') {
      setErr('Table home_trust_items not found — run 016_home_cms.sql. Showing Home fallback. Save a new item to create the table data.')
      setRows([]); setLoading(false); return
    }
    if (!data || data.filter((r: any) => !r.deleted_at).length === 0) {
      // Show fallback preview but keep rows empty so list reflects fallback
    }
    setRows(data ?? []); setLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])
  const save = async () => {
    if (!editing?.label?.trim()) { setErr('Label required'); return }
    setSaving(true)
    const payload = { icon: editing.icon || 'ShieldCheck', label: editing.label.trim(), display_order: Number(editing.display_order) || 0, published: true, deleted_at: null }
    const { error } = editing.id ? await supabase.from('home_trust_items').update(payload).eq('id', editing.id) : await supabase.from('home_trust_items').insert(payload)
    setSaving(false)
    if (error) { setErr(error.message); return }
    setEditing(null); void load()
  }
  const del = async (r: any) => {
    if (!window.confirm(`Delete "${r.label}"?`)) return
    await supabase.from('home_trust_items').update({ deleted_at: new Date().toISOString() }).eq('id', r.id)
    void load()
  }
  const move = async (r: any, dir: -1 | 1) => {
    const idx = rows.findIndex((x) => x.id === r.id); const tgt = rows[idx + dir]; if (!tgt) return
    await Promise.all([
      supabase.from('home_trust_items').update({ display_order: tgt.display_order }).eq('id', r.id),
      supabase.from('home_trust_items').update({ display_order: r.display_order }).eq('id', tgt.id),
    ]); void load()
  }
  const visible = rows.filter((r) => !r.deleted_at)
  const displayRows = visible.length > 0 ? visible : FALLBACK_TRUST.map((f, i) => ({ id: `fallback-${i}`, icon: f.icon, label: f.label, display_order: i + 1, _fallback: true }))
  if (loading) return <Skeletons count={4} />
  return (
    <div>
      <ErrorBanner message={err} onDismiss={() => setErr('')} />
      {visible.length === 0 && !err && <p className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700 ring-1 ring-amber-200">No saved trust cards yet — Home is showing the fallback below. Add a card to take over (first save creates live records).</p>}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-ink-light">{visible.length > 0 ? `${visible.length} live cards — edits update Home instantly` : `Home fallback: ${FALLBACK_TRUST.length} cards`}</p>
        <button onClick={() => setEditing({ icon: 'ShieldCheck', label: '', display_order: visible.length + 1 })} className="inline-flex items-center gap-2 rounded-xl bg-brand-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600"><Plus size={14} /> Add Trust Item</button>
      </div>
      <ul className="space-y-2">
        {displayRows.map((r: any, i) => (
          <li key={r.id} className={`flex items-center gap-3 rounded-2xl border p-4 shadow-soft ${r._fallback ? 'border-amber-200 bg-amber-50/60' : 'border-gray-100 bg-white'}`}>
            <span className="hidden h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy sm:flex">{r.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-navy">{r.label} {r._fallback && <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">FALLBACK</span>}</p>
              <p className="text-xs text-gray-400">{r.icon} · order {r.display_order}</p>
            </div>
            {r._fallback ? (
              <span className="text-xs text-ink-light">Save a new item to replace</span>
            ) : (
              <>
                <button onClick={() => move(r, -1)} disabled={i === 0} className="rounded-lg p-2 hover:bg-mist disabled:opacity-25"><ChevronUp size={14} /></button>
                <button onClick={() => move(r, 1)} disabled={i === visible.length - 1} className="rounded-lg p-2 hover:bg-mist disabled:opacity-25"><ChevronDown size={14} /></button>
                <button onClick={() => setEditing(r)} className="rounded-lg p-2 hover:bg-navy-50"><Pencil size={14} /></button>
                <button onClick={() => del(r)} className="rounded-lg p-2 text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
              </>
            )}
          </li>
        ))}
      </ul>

      <Drawer open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Trust Item' : 'Add Trust Item'} subtitle="These are the 5 badges under the hero. Keep labels short.">
        {editing && (
          <div className="space-y-4">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Label *</span><input value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="e.g., Reliable Procurement" className={inputClass} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Icon</span><IconSelect value={editing.icon} onChange={(v) => setEditing({ ...editing, icon: v })} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Order</span><input type="number" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} className={inputClass} /></label>
            <div className="flex gap-3 pt-2"><button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-brand-green-500 py-3 font-semibold text-white hover:bg-brand-green-600 disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button><button onClick={() => setEditing(null)} className="rounded-xl border px-6 py-3">Cancel</button></div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

// ── About ──
function AboutTab() {
  const [row, setRow] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState(false)
  const [isFallback, setIsFallback] = useState(false)
  const load = useCallback(async () => {
    setLoading(true); setErr('')
    const { data, error } = await supabase.from('home_about').select('*').limit(1).maybeSingle()
    if (error && (error as any).code === '42P01') {
      setErr('Table home_about not found — run 016_home_cms.sql. Showing Home fallback.')
      setRow({ ...FALLBACK_ABOUT }); setIsFallback(true); setLoading(false); return
    }
    if (data) { setRow(data); setIsFallback(false) }
    else { setRow({ ...FALLBACK_ABOUT }); setIsFallback(true) }
    setLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])
  const save = async () => {
    setSaving(true); setErr(''); setOk(false)
    const payload = { eyebrow: row.eyebrow, title_prefix: row.title_prefix, title_highlight: row.title_highlight, paragraph1: row.paragraph1, paragraph2: row.paragraph2, badge_value: row.badge_value, badge_label: row.badge_label, phone: row.phone, phone_label: row.phone_label, primary_label: row.primary_label, primary_link: row.primary_link, image_url: row.image_url || null, overlay_url: row.overlay_url || null, published: true }
    const { error, data } = row.id ? await supabase.from('home_about').update(payload).eq('id', row.id).select().maybeSingle() : await supabase.from('home_about').insert(payload).select().maybeSingle()
    setSaving(false)
    if (error) setErr(error.message); else { setOk(true); if (data) setRow(data); setIsFallback(false); setTimeout(() => setOk(false), 2500) }
  }
  if (loading) return <Skeletons count={3} />
  return (
    <div className="space-y-5">
      <ErrorBanner message={err} onDismiss={() => setErr('')} />
      {isFallback && <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700 ring-1 ring-amber-200">Showing current Home fallback. Edit and Save to create the live About record.</p>}
      {[
        ['Eyebrow', 'eyebrow'],
        ['Title prefix', 'title_prefix'],
        ['Title highlight', 'title_highlight'],
        ['Paragraph 1', 'paragraph1', true],
        ['Paragraph 2', 'paragraph2', true],
        ['Badge value', 'badge_value'],
        ['Badge label', 'badge_label'],
        ['Phone', 'phone'],
        ['Phone label', 'phone_label'],
        ['Button label', 'primary_label'],
        ['Button link', 'primary_link'],
        ['Main image URL', 'image_url'],
        ['Overlay image URL', 'overlay_url'],
      ].map(([label, key, isArea]) => (
        <label key={String(key)} className="block">
          <span className="mb-1.5 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">{label}</span>
          {isArea ? <textarea rows={3} value={row[String(key)] ?? ''} onChange={(e) => setRow({ ...row, [String(key)]: e.target.value })} className={`${inputClass} resize-none`} /> : <input value={row[String(key)] ?? ''} onChange={(e) => setRow({ ...row, [String(key)]: e.target.value })} className={inputClass} />}
        </label>
      ))}
      <p className="text-xs text-ink-light">Images can also be set via Media Library → home_about / home_about_overlay for automatic fallback.</p>
      <button onClick={save} disabled={saving} className="rounded-xl bg-brand-green-500 px-6 py-3 font-semibold text-white hover:bg-brand-green-600 disabled:opacity-60">{saving ? 'Saving…' : ok ? 'Saved — Home updated!' : 'Save About'}</button>
    </div>
  )
}

// ── Stats ──
function StatsTab() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const load = useCallback(async () => {
    setLoading(true); setErr('')
    const { data, error } = await supabase.from('home_stats').select('*').order('display_order').order('created_at')
    if (error && (error as any).code === '42P01') {
      setErr('Table home_stats not found — run 016_home_cms.sql. Showing Home fallback.')
      setRows([]); setLoading(false); return
    }
    setRows(data ?? []); setLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])
  const save = async () => {
    if (!editing?.label?.trim()) { setErr('Label required'); return }
    setSaving(true)
    const payload = { value: Number(editing.value) || 0, suffix: editing.suffix ?? '', label: editing.label.trim(), display_order: Number(editing.display_order) || 0, published: true, deleted_at: null }
    const { error } = editing.id ? await supabase.from('home_stats').update(payload).eq('id', editing.id) : await supabase.from('home_stats').insert(payload)
    setSaving(false)
    if (error) { setErr(error.message); return }
    setEditing(null); void load()
  }
  const del = async (r: any) => {
    if (!window.confirm(`Delete "${r.label}"?`)) return
    await supabase.from('home_stats').update({ deleted_at: new Date().toISOString() }).eq('id', r.id); void load()
  }
  const move = async (r: any, dir: -1 | 1) => {
    const act = rows.filter((x) => !x.deleted_at); const idx = act.findIndex((x) => x.id === r.id); const tgt = act[idx + dir]; if (!tgt) return
    await Promise.all([supabase.from('home_stats').update({ display_order: tgt.display_order }).eq('id', r.id), supabase.from('home_stats').update({ display_order: r.display_order }).eq('id', tgt.id)]); void load()
  }
  const visibleStats = rows.filter((r) => !r.deleted_at)
  const displayStats = visibleStats.length > 0 ? visibleStats : FALLBACK_STATS.map((f, i) => ({ id: `fallback-${i}`, value: f.value, suffix: f.suffix, label: f.label, display_order: i + 1, _fallback: true }))
  if (loading) return <Skeletons count={4} />
  return (
    <div>
      <ErrorBanner message={err} onDismiss={() => setErr('')} />
      {visibleStats.length === 0 && !err && <p className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700 ring-1 ring-amber-200">No saved stats yet — Home is showing fallback below.</p>}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-ink-light">{visibleStats.length > 0 ? `${visibleStats.length} live stats` : `Home fallback: ${FALLBACK_STATS.length} stats`}</p>
        <button onClick={() => setEditing({ value: 100, suffix: '+', label: '', display_order: visibleStats.length + 1 })} className="inline-flex items-center gap-2 rounded-xl bg-brand-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600"><Plus size={14} /> Add Stat</button>
      </div>
      <ul className="space-y-2">
        {displayStats.map((r: any, i) => (
          <li key={r.id} className={`flex items-center gap-3 rounded-2xl border p-4 shadow-soft ${r._fallback ? 'border-amber-200 bg-amber-50/60' : 'border-gray-100 bg-white'}`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green-50 font-display text-sm font-bold text-brand-green-600">{r.value}{r.suffix}</span>
            <div className="min-w-0 flex-1"><p className="font-semibold text-navy">{r.value}{r.suffix} — {r.label} {r._fallback && <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">FALLBACK</span>}</p><p className="text-xs text-gray-400">order {r.display_order}</p></div>
            {r._fallback ? <span className="text-xs text-ink-light">Save to replace</span> : (
              <>
                <button onClick={() => move(r, -1)} disabled={i === 0} className="rounded-lg p-2 hover:bg-mist disabled:opacity-25"><ChevronUp size={14} /></button>
                <button onClick={() => move(r, 1)} disabled={i === visibleStats.length - 1} className="rounded-lg p-2 hover:bg-mist disabled:opacity-25"><ChevronDown size={14} /></button>
                <button onClick={() => setEditing(r)} className="rounded-lg p-2 hover:bg-navy-50"><Pencil size={14} /></button>
                <button onClick={() => del(r)} className="rounded-lg p-2 text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
              </>
            )}
          </li>
        ))}
      </ul>
      <Drawer open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Stat' : 'Add Stat'}>
        {editing && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Value *</span><input type="number" value={editing.value} onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })} className={inputClass} /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Suffix</span><input value={editing.suffix} onChange={(e) => setEditing({ ...editing, suffix: e.target.value })} placeholder="+ / % / h" className={inputClass} /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Order</span><input type="number" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} className={inputClass} /></label>
            </div>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Label *</span><input value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="e.g., Supplier Network" className={inputClass} /></label>
            <div className="flex gap-3 pt-2"><button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-brand-green-500 py-3 font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button><button onClick={() => setEditing(null)} className="rounded-xl border px-6 py-3">Cancel</button></div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

// ── CTA ──
function CtaTab() {
  const [row, setRow] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState(false)
  const [isFallback, setIsFallback] = useState(false)
  const load = useCallback(async () => {
    setLoading(true); setErr('')
    const { data, error } = await supabase.from('home_cta').select('*').limit(1).maybeSingle()
    if (error && (error as any).code === '42P01') {
      setErr('Table home_cta not found — run 016_home_cms.sql. Showing Home fallback.')
      setRow({ ...FALLBACK_CTA }); setIsFallback(true); setLoading(false); return
    }
    if (data) { setRow(data); setIsFallback(false) }
    else { setRow({ ...FALLBACK_CTA }); setIsFallback(true) }
    setLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])
  const save = async () => {
    setSaving(true); setErr(''); setOk(false)
    const payload = { eyebrow: row.eyebrow, title_prefix: row.title_prefix, title_highlight: row.title_highlight, subtitle: row.subtitle, primary_label: row.primary_label, primary_link: row.primary_link, secondary_label: row.secondary_label, secondary_link: row.secondary_link, feature1: row.feature1, feature2: row.feature2, feature3: row.feature3, bg_image_url: row.bg_image_url || null, published: true }
    const { error, data } = row.id ? await supabase.from('home_cta').update(payload).eq('id', row.id).select().maybeSingle() : await supabase.from('home_cta').insert(payload).select().maybeSingle()
    setSaving(false)
    if (error) setErr(error.message); else { setOk(true); if (data) setRow(data); setIsFallback(false); setTimeout(() => setOk(false), 2500) }
  }
  if (loading) return <Skeletons count={3} />
  return (
    <div className="space-y-5">
      <ErrorBanner message={err} onDismiss={() => setErr('')} />
      {isFallback && <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700 ring-1 ring-amber-200">Showing current Home fallback. Save to create the live CTA record.</p>}
      {[
        ['Eyebrow', 'eyebrow'],
        ['Title prefix', 'title_prefix'],
        ['Title highlight (gold)', 'title_highlight'],
        ['Subtitle', 'subtitle', true],
        ['Primary label', 'primary_label'],
        ['Primary link', 'primary_link'],
        ['Secondary label', 'secondary_label'],
        ['Secondary link', 'secondary_link'],
        ['Feature 1', 'feature1'],
        ['Feature 2', 'feature2'],
        ['Feature 3', 'feature3'],
        ['Background image URL', 'bg_image_url'],
      ].map(([label, key, isArea]) => (
        <label key={String(key)} className="block">
          <span className="mb-1.5 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">{label}</span>
          {isArea ? <textarea rows={3} value={row[String(key)] ?? ''} onChange={(e) => setRow({ ...row, [String(key)]: e.target.value })} className={`${inputClass} resize-none`} /> : <input value={row[String(key)] ?? ''} onChange={(e) => setRow({ ...row, [String(key)]: e.target.value })} className={inputClass} />}
        </label>
      ))}
      <CtaDesignCard />
      <button onClick={() => void save()} disabled={saving} className="rounded-xl bg-brand-green-500 px-6 py-3 font-semibold text-white hover:bg-brand-green-600 disabled:opacity-60">{saving ? 'Saving…' : ok ? 'Saved!' : 'Save CTA'}</button>
    </div>
  )
}

function ServicesHomeTab() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('services').select('*').order('display_order').order('created_at')
    if (error) setErr(error.message); else setRows(data ?? [])
    setLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])
  const save = async () => {
    if (!editing?.name?.trim()) { setErr('Name required'); return }
    setSaving(true)
    const payload = { name: editing.name.trim(), category: editing.category || null, short_description: editing.short_description || null, full_description: editing.full_description || null, published: !!editing.published, show_in_footer: !!editing.show_in_footer, display_order: Number(editing.display_order) || 0 }
    const { error } = editing.id ? await supabase.from('services').update(payload).eq('id', editing.id) : await supabase.from('services').insert(payload)
    setSaving(false)
    if (error) setErr(error.message); else { setEditing(null); void load() }
  }
  const del = async (r: any) => { if (!window.confirm(`Delete "${r.name}"?`)) return; await supabase.from('services').update({ deleted_at: new Date().toISOString() }).eq('id', r.id); void load() }
  const move = async (r: any, dir: -1 | 1) => {
    const act = rows.filter((x) => !x.deleted_at); const idx = act.findIndex((x) => x.id === r.id); const tgt = act[idx + dir]; if (!tgt) return
    await Promise.all([supabase.from('services').update({ display_order: tgt.display_order }).eq('id', r.id), supabase.from('services').update({ display_order: r.display_order }).eq('id', tgt.id)]); void load()
  }
  const toggleFooter = async (r: any) => {
    const { error } = await supabase.from('services').update({ show_in_footer: !r.show_in_footer }).eq('id', r.id)
    if (error) setErr(error.message); else void load()
  }
  if (loading) return <Skeletons count={4} />
  const visible = rows.filter((r) => !r.deleted_at)
  return (
    <div>
      <ErrorBanner message={err} onDismiss={() => setErr('')} />
      <p className="mb-3 text-xs text-ink-light">Home shows first 7 published services by <em>display_order</em>. {visible.length} total — edits update Home instantly. Toggle <em>Show in footer</em> to control footer Services column. Full manager at <a href="/admin/services" className="font-semibold text-brand-green-600 hover:underline">Admin → Services</a>.</p>
      <div className="mb-4 flex justify-end"><button onClick={() => setEditing({ name: '', short_description: '', category: '', full_description: '', published: true, show_in_footer: false, display_order: visible.length + 1 })} className="inline-flex items-center gap-2 rounded-xl bg-brand-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600"><Plus size={14} /> Add Service Card</button></div>
      <ul className="space-y-2">
        {visible.map((r, i) => (
          <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-soft">
            <div className="min-w-0 flex-1"><p className="font-semibold text-navy">{r.name} {!r.published && <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px]">DRAFT</span>} {r.show_in_footer && <span className="ml-2 rounded-full bg-gold-50 px-2 py-0.5 text-[10px] font-bold text-gold-600 ring-1 ring-gold-200">IN FOOTER</span>}</p><p className="truncate text-xs text-ink-light">{r.short_description || '—'}</p></div>
            <button onClick={() => toggleFooter(r)} title={r.show_in_footer ? 'Remove from footer' : 'Show in footer'} className={`hidden sm:inline-flex rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${r.show_in_footer ? 'bg-gold-50 text-gold-600 ring-gold-200' : 'bg-white text-ink-light ring-gray-200'}`}>{r.show_in_footer ? 'In footer' : 'Show in footer'}</button>
            <button onClick={() => move(r, -1)} disabled={i === 0} className="rounded-lg p-2 hover:bg-mist disabled:opacity-25"><ChevronUp size={14} /></button>
            <button onClick={() => move(r, 1)} disabled={i === visible.length - 1} className="rounded-lg p-2 hover:bg-mist disabled:opacity-25"><ChevronDown size={14} /></button>
            <button onClick={() => setEditing(r)} className="rounded-lg p-2 hover:bg-navy-50"><Pencil size={14} /></button>
            <button onClick={() => del(r)} className="rounded-lg p-2 text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
          </li>
        ))}
        {visible.length === 0 && <p className="py-8 text-center text-sm text-ink-light">No services — Home is showing fallback cards.</p>}
      </ul>
      <Drawer open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Service Card' : 'Add Service Card'} subtitle="Shown on Home → What We Offer (first 7 published). Toggle footer to show in footer Services column.">
        {editing && (
          <div className="space-y-4">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Title *</span><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={inputClass} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Description</span><textarea rows={3} value={editing.short_description ?? ''} onChange={(e) => setEditing({ ...editing, short_description: e.target.value })} className={`${inputClass} resize-none`} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Order</span><input type="number" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} className={inputClass} /></label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 rounded-xl border bg-mist/50 p-3"><input type="checkbox" checked={!!editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} className="h-4 w-4 accent-brand-green-500" /><span className="text-sm font-medium">Published</span></label>
                <label className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50/50 p-3"><input type="checkbox" checked={!!editing.show_in_footer} onChange={(e) => setEditing({ ...editing, show_in_footer: e.target.checked })} className="h-4 w-4 accent-gold-400" /><span className="text-sm font-medium">Show in footer</span></label>
              </div>
            </div>
            <div className="flex gap-3 pt-2"><button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-brand-green-500 py-3 font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button><button onClick={() => setEditing(null)} className="rounded-xl border px-6 py-3">Cancel</button></div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

function IndustriesHomeTab() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('industries').select('*').order('display_order').order('created_at')
    if (error) setErr(error.message); else setRows(data ?? [])
    setLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])
  const save = async () => {
    if (!editing?.name?.trim()) { setErr('Name required'); return }
    setSaving(true)
    const payload = { name: editing.name.trim(), description: editing.description || '', icon: editing.icon || 'Building2', display_order: Number(editing.display_order) || 0, published: !!editing.published, deleted_at: null }
    const { error } = editing.id ? await supabase.from('industries').update(payload).eq('id', editing.id) : await supabase.from('industries').insert(payload)
    setSaving(false); if (error) setErr(error.message); else { setEditing(null); void load() }
  }
  const del = async (r: any) => { if (!window.confirm(`Delete "${r.name}"?`)) return; await supabase.from('industries').update({ deleted_at: new Date().toISOString() }).eq('id', r.id); void load() }
  const move = async (r: any, dir: -1 | 1) => { const act = rows.filter((x) => !x.deleted_at); const idx = act.findIndex((x) => x.id === r.id); const tgt = act[idx + dir]; if (!tgt) return; await Promise.all([supabase.from('industries').update({ display_order: tgt.display_order }).eq('id', r.id), supabase.from('industries').update({ display_order: r.display_order }).eq('id', tgt.id)]); void load() }
  if (loading) return <Skeletons count={4} />
  const visible = rows.filter((r) => !r.deleted_at)
  return (
    <div>
      <ErrorBanner message={err} onDismiss={() => setErr('')} />
      <p className="mb-3 text-xs text-ink-light">Home → Who We Serve grid. {visible.length} industries — edits update Home instantly.</p>
      <div className="mb-4 flex justify-end"><button onClick={() => setEditing({ name: '', icon: 'Building2', description: '', display_order: visible.length + 1, published: true })} className="inline-flex items-center gap-2 rounded-xl bg-brand-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600"><Plus size={14} /> Add Industry</button></div>
      <ul className="space-y-2">
        {visible.map((r, i) => (
          <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-soft">
            <span className="hidden h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy sm:flex">{r.icon}</span>
            <div className="min-w-0 flex-1"><p className="font-semibold text-navy">{r.name}</p><p className="truncate text-xs text-ink-light">{r.description || '—'}</p></div>
            <button onClick={() => move(r, -1)} disabled={i === 0} className="rounded-lg p-2 hover:bg-mist disabled:opacity-25"><ChevronUp size={14} /></button>
            <button onClick={() => move(r, 1)} disabled={i === visible.length - 1} className="rounded-lg p-2 hover:bg-mist disabled:opacity-25"><ChevronDown size={14} /></button>
            <button onClick={() => setEditing(r)} className="rounded-lg p-2 hover:bg-navy-50"><Pencil size={14} /></button>
            <button onClick={() => del(r)} className="rounded-lg p-2 text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
          </li>
        ))}
      </ul>
      <Drawer open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Industry' : 'Add Industry'}>
        {editing && (
          <div className="space-y-4">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Name *</span><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={inputClass} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Icon</span><IconSelect value={editing.icon} onChange={(v) => setEditing({ ...editing, icon: v })} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Description</span><textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={`${inputClass} resize-none`} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Order</span><input type="number" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} className={inputClass} /></label>
              <label className="flex items-center gap-2 rounded-xl border bg-mist/50 p-3"><input type="checkbox" checked={!!editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} className="h-4 w-4 accent-brand-green-500" /><span className="text-sm font-medium">Published</span></label>
            </div>
            <div className="flex gap-3 pt-2"><button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-brand-green-500 py-3 font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button><button onClick={() => setEditing(null)} className="rounded-xl border px-6 py-3">Cancel</button></div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

function WhyHomeTab() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('why_choose_us').select('*').order('display_order').order('created_at')
    if (error) setErr(error.message); else setRows(data ?? [])
    setLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])
  const save = async () => {
    if (!editing?.title?.trim()) { setErr('Title required'); return }
    setSaving(true)
    const payload = { title: editing.title.trim(), description: editing.description || '', icon: editing.icon || 'Handshake', display_order: Number(editing.display_order) || 0, published: !!editing.published, deleted_at: null }
    const { error } = editing.id ? await supabase.from('why_choose_us').update(payload).eq('id', editing.id) : await supabase.from('why_choose_us').insert(payload)
    setSaving(false); if (error) setErr(error.message); else { setEditing(null); void load() }
  }
  const del = async (r: any) => { if (!window.confirm(`Delete "${r.title}"?`)) return; await supabase.from('why_choose_us').update({ deleted_at: new Date().toISOString() }).eq('id', r.id); void load() }
  const move = async (r: any, dir: -1 | 1) => { const act = rows.filter((x) => !x.deleted_at); const idx = act.findIndex((x) => x.id === r.id); const tgt = act[idx + dir]; if (!tgt) return; await Promise.all([supabase.from('why_choose_us').update({ display_order: tgt.display_order }).eq('id', r.id), supabase.from('why_choose_us').update({ display_order: r.display_order }).eq('id', tgt.id)]); void load() }
  if (loading) return <Skeletons count={4} />
  const visible = rows.filter((r) => !r.deleted_at)
  return (
    <div>
      <ErrorBanner message={err} onDismiss={() => setErr('')} />
      <p className="mb-3 text-xs text-ink-light">Home → Why Choose GNAB feature cards (dark section). {visible.length} cards.</p>
      <div className="mb-4 flex justify-end"><button onClick={() => setEditing({ title: '', description: '', icon: 'Handshake', display_order: visible.length + 1, published: true })} className="inline-flex items-center gap-2 rounded-xl bg-brand-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600"><Plus size={14} /> Add Card</button></div>
      <ul className="space-y-2">
        {visible.map((r, i) => (
          <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-soft">
            <span className="hidden h-9 w-9 items-center justify-center rounded-xl bg-gold-50 text-gold-600 sm:flex">{r.icon}</span>
            <div className="min-w-0 flex-1"><p className="font-semibold text-navy">{r.title}</p><p className="truncate text-xs text-ink-light">{r.description || '—'}</p></div>
            <button onClick={() => move(r, -1)} disabled={i === 0} className="rounded-lg p-2 hover:bg-mist disabled:opacity-25"><ChevronUp size={14} /></button>
            <button onClick={() => move(r, 1)} disabled={i === visible.length - 1} className="rounded-lg p-2 hover:bg-mist disabled:opacity-25"><ChevronDown size={14} /></button>
            <button onClick={() => setEditing(r)} className="rounded-lg p-2 hover:bg-navy-50"><Pencil size={14} /></button>
            <button onClick={() => del(r)} className="rounded-lg p-2 text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
          </li>
        ))}
      </ul>
      <Drawer open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Card' : 'Add Card'}>
        {editing && (
          <div className="space-y-4">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Title *</span><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={inputClass} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Icon</span><IconSelect value={editing.icon} onChange={(v) => setEditing({ ...editing, icon: v })} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Description</span><textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={`${inputClass} resize-none`} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Order</span><input type="number" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} className={inputClass} /></label>
              <label className="flex items-center gap-2 rounded-xl border bg-mist/50 p-3"><input type="checkbox" checked={!!editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} className="h-4 w-4 accent-brand-green-500" /><span className="text-sm font-medium">Published</span></label>
            </div>
            <div className="flex gap-3 pt-2"><button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-brand-green-500 py-3 font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button><button onClick={() => setEditing(null)} className="rounded-xl border px-6 py-3">Cancel</button></div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

function ProcessHomeTab() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('process_steps').select('*').order('display_order').order('created_at')
    if (error) setErr(error.message); else setRows(data ?? [])
    setLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])
  const save = async () => {
    if (!editing?.title?.trim()) { setErr('Title required'); return }
    setSaving(true)
    const payload = { step_number: editing.step_number || '01', title: editing.title.trim(), description: editing.description || '', display_order: Number(editing.display_order) || 0, published: !!editing.published, deleted_at: null }
    const { error } = editing.id ? await supabase.from('process_steps').update(payload).eq('id', editing.id) : await supabase.from('process_steps').insert(payload)
    setSaving(false); if (error) setErr(error.message); else { setEditing(null); void load() }
  }
  const del = async (r: any) => { if (!window.confirm(`Delete "${r.title}"?`)) return; await supabase.from('process_steps').update({ deleted_at: new Date().toISOString() }).eq('id', r.id); void load() }
  const move = async (r: any, dir: -1 | 1) => { const act = rows.filter((x) => !x.deleted_at); const idx = act.findIndex((x) => x.id === r.id); const tgt = act[idx + dir]; if (!tgt) return; await Promise.all([supabase.from('process_steps').update({ display_order: tgt.display_order }).eq('id', r.id), supabase.from('process_steps').update({ display_order: r.display_order }).eq('id', tgt.id)]); void load() }
  if (loading) return <Skeletons count={4} />
  const visible = rows.filter((r) => !r.deleted_at)
  return (
    <div>
      <ErrorBanner message={err} onDismiss={() => setErr('')} />
      <p className="mb-3 text-xs text-ink-light">Home → How It Works (6 steps + gold rail). {visible.length} steps.</p>
      <div className="mb-4 flex justify-end"><button onClick={() => setEditing({ step_number: String(visible.length + 1).padStart(2, '0'), title: '', description: '', display_order: visible.length + 1, published: true })} className="inline-flex items-center gap-2 rounded-xl bg-brand-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600"><Plus size={14} /> Add Step</button></div>
      <ul className="space-y-2">
        {visible.map((r, i) => (
          <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-soft">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-400 font-display text-xs font-bold text-navy">{r.step_number}</span>
            <div className="min-w-0 flex-1"><p className="font-semibold text-navy">{r.step_number} — {r.title}</p><p className="truncate text-xs text-ink-light">{r.description || '—'}</p></div>
            <button onClick={() => move(r, -1)} disabled={i === 0} className="rounded-lg p-2 hover:bg-mist disabled:opacity-25"><ChevronUp size={14} /></button>
            <button onClick={() => move(r, 1)} disabled={i === visible.length - 1} className="rounded-lg p-2 hover:bg-mist disabled:opacity-25"><ChevronDown size={14} /></button>
            <button onClick={() => setEditing(r)} className="rounded-lg p-2 hover:bg-navy-50"><Pencil size={14} /></button>
            <button onClick={() => del(r)} className="rounded-lg p-2 text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
          </li>
        ))}
      </ul>
      <Drawer open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Step' : 'Add Step'}>
        {editing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Number (01…)</span><input value={editing.step_number} onChange={(e) => setEditing({ ...editing, step_number: e.target.value })} className={inputClass} /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Order</span><input type="number" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} className={inputClass} /></label>
            </div>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Title *</span><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={inputClass} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Description</span><textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={`${inputClass} resize-none`} /></label>
            <label className="flex items-center gap-2 rounded-xl border bg-mist/50 p-3"><input type="checkbox" checked={!!editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} className="h-4 w-4 accent-brand-green-500" /><span className="text-sm font-medium">Published</span></label>
            <div className="flex gap-3 pt-2"><button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-brand-green-500 py-3 font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button><button onClick={() => setEditing(null)} className="rounded-xl border px-6 py-3">Cancel</button></div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default function HomeAdminPage() {
  const [tab, setTab] = useState<Tab>('hero')

  useEffect(() => { document.title = 'Home Page | GNAB Admin' }, [])

  return (
    <div>
      <PageIntro
        title="Home Page"
        description="Full control of every Home section and its feature cards. Services, Industries, Why Us and Process cards are also editable on their own pages — this is your single switchboard for the entire Home."
        action={<span className="rounded-full bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy ring-1 ring-navy-100">Edits go live immediately</span>}
      />

      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-soft">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${tab === t.id ? 'bg-navy text-white shadow-md' : 'bg-mist text-ink-light hover:bg-navy-50 hover:text-navy'}`}
            title={t.hint}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-soft md:p-8">
        {tab === 'hero' && <HeroTab />}
        {tab === 'trust' && <TrustTab />}
        {tab === 'about' && <AboutTab />}
        {tab === 'services' && <ServicesHomeTab />}
        {tab === 'industries' && <IndustriesHomeTab />}
        {tab === 'why' && <WhyHomeTab />}
        {tab === 'process' && <ProcessHomeTab />}
        {tab === 'stats' && <StatsTab />}
        {tab === 'cta' && <CtaTab />}
      </div>

      <p className="mt-6 text-center text-xs text-ink-light">Tip: Hero images & About images also live in <span className="font-semibold">Admin → Media Library</span> under sections <code>home_hero</code>, <code>home_about</code>, <code>home_cta</code>.</p>
    </div>
  )
}
