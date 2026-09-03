import { useCallback, useEffect, useState } from 'react'
import { Check, Eye, Pencil, Plus, Trash2, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageIntro } from '@/components/admin/AdminLayout'
import { Drawer, ErrorBanner, Skeletons } from '@/components/admin/bits'
import { useSiteSettings } from '@/lib/siteData'
import { FooterHeadingDesignCard } from '@/components/admin/DesignControls'
import { NAV_LINKS } from '@/lib/utils'
import { inputClass } from '@/components/ui'

type FooterDraft = {
  footer_show_brand: string
  footer_show_quick_links: string
  footer_quick_links: string
  footer_show_services: string
  footer_show_contact: string
  footer_show_socials: string
  footer_show_bottom: string
  footer_quick_links_title: string
  footer_services_title: string
  footer_contact_title: string
  footer_text: string
  company_description: string
  tagline: string
  email: string
  phone: string
  address: string
  social_linkedin: string
  social_facebook: string
  social_twitter: string
  social_instagram: string
}

const ALL_QUICK = [...NAV_LINKS.map((l) => ({ name: l.name, path: l.path })), { name: 'Become a Supplier', path: '/supplier-registration' }]

function parseQuickLinks(raw: string): { name: string; path: string }[] {
  try {
    const arr = JSON.parse(raw || '[]')
    if (!Array.isArray(arr) || arr.length === 0) return ALL_QUICK.slice(0, 8) as { name: string; path: string }[]
    // support both string paths (legacy) and objects
    if (typeof arr[0] === 'string') {
      const set = new Set(arr as string[])
      return (ALL_QUICK as { name: string; path: string }[]).filter((x) => set.has(x.path))
    }
    return arr as { name: string; path: string }[]
  } catch { return ALL_QUICK.slice(0, 8) as { name: string; path: string }[] }
}

export default function FooterAdminPage() {
  const settings = useSiteSettings()
  const [draft, setDraft] = useState<FooterDraft>({
    footer_show_brand: 'true',
    footer_show_quick_links: 'true',
    footer_quick_links: '[]',
    footer_show_services: 'true',
    footer_show_contact: 'true',
    footer_show_socials: 'true',
    footer_show_bottom: 'true',
    footer_quick_links_title: 'Quick Links',
    footer_services_title: 'Services',
    footer_contact_title: 'Contact',
    footer_text: '',
    company_description: '',
    tagline: '',
    email: '',
    phone: '',
    address: '',
    social_linkedin: '',
    social_facebook: '',
    social_twitter: '',
    social_instagram: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [saved, setSaved] = useState(false)
  const [services, setServices] = useState<{ id: string; name: string; show_in_footer: boolean; published: boolean }[]>([])
  const [quickEdit, setQuickEdit] = useState<{ name: string; path: string } | null>(null)
  const [quickIdx, setQuickIdx] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const keys = ['footer_show_brand','footer_show_quick_links','footer_quick_links','footer_show_services','footer_show_contact','footer_show_socials','footer_show_bottom','footer_quick_links_title','footer_services_title','footer_contact_title','footer_text','company_description','tagline','email','phone','address','social_linkedin','social_facebook','social_twitter','social_instagram']
    const { data } = await supabase.from('site_settings').select('key, value').in('key', keys)
    const map: Record<string, string> = {}
    data?.forEach((r) => (map[r.key] = r.value))
    // Normalize footer_quick_links to object array for editing (supports legacy string array)
    let rawQuick = map.footer_quick_links ?? settings.footer_quick_links
    try {
      const arr = rawQuick ? JSON.parse(rawQuick) : null
      if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'string') {
        rawQuick = JSON.stringify(ALL_QUICK.filter((x) => (arr as string[]).includes(x.path)))
      } else if (!arr || (Array.isArray(arr) && arr.length === 0)) {
        rawQuick = JSON.stringify(ALL_QUICK.slice(0, 8))
      }
    } catch { rawQuick = JSON.stringify(ALL_QUICK.slice(0, 8)) }
    setDraft({
      footer_show_brand: map.footer_show_brand ?? (settings.footer_show_brand ?? 'true'),
      footer_show_quick_links: map.footer_show_quick_links ?? (settings.footer_show_quick_links ?? 'true'),
      footer_quick_links: rawQuick,
      footer_show_services: map.footer_show_services ?? (settings.footer_show_services ?? 'true'),
      footer_show_contact: map.footer_show_contact ?? (settings.footer_show_contact ?? 'true'),
      footer_show_socials: map.footer_show_socials ?? (settings.footer_show_socials ?? 'true'),
      footer_show_bottom: map.footer_show_bottom ?? (settings.footer_show_bottom ?? 'true'),
      footer_quick_links_title: map.footer_quick_links_title ?? (settings.footer_quick_links_title ?? 'Quick Links'),
      footer_services_title: map.footer_services_title ?? (settings.footer_services_title ?? 'Services'),
      footer_contact_title: map.footer_contact_title ?? (settings.footer_contact_title ?? 'Contact'),
      footer_text: map.footer_text ?? (settings.footer_text ?? ''),
      company_description: map.company_description ?? (settings.company_description ?? ''),
      tagline: map.tagline ?? (settings.tagline ?? ''),
      email: map.email ?? (settings.email ?? ''),
      phone: map.phone ?? (settings.phone ?? ''),
      address: map.address ?? (settings.address ?? ''),
      social_linkedin: map.social_linkedin ?? (settings.social_linkedin ?? ''),
      social_facebook: map.social_facebook ?? (settings.social_facebook ?? ''),
      social_twitter: map.social_twitter ?? (settings.social_twitter ?? ''),
      social_instagram: map.social_instagram ?? (settings.social_instagram ?? ''),
    })
    const { data: svc } = await supabase.from('services').select('id, name, show_in_footer, published').order('display_order')
    setServices((svc as any) ?? [])
    setLoading(false)
  }, [settings.footer_show_brand, settings.footer_show_quick_links, settings.footer_quick_links, settings.footer_show_services, settings.footer_show_contact, settings.footer_show_socials, settings.footer_show_bottom, settings.footer_quick_links_title, settings.footer_services_title, settings.footer_contact_title, settings.footer_text, settings.company_description, settings.tagline, settings.email, settings.phone, settings.address, settings.social_linkedin, settings.social_facebook, settings.social_twitter, settings.social_instagram])

  useEffect(() => { document.title = 'Footer | GNAB Admin'; void load() }, [load])

  const quickLinks = parseQuickLinks(draft.footer_quick_links)

  const saveQuickLinks = (links: { name: string; path: string }[]) => {
    setDraft({ ...draft, footer_quick_links: JSON.stringify(links) })
  }

  const toggleServiceFooter = async (svc: { id: string; show_in_footer: boolean }) => {
    const { error } = await supabase.from('services').update({ show_in_footer: !svc.show_in_footer }).eq('id', svc.id)
    if (error) setErr(error.message); else void load()
  }

  const save = async () => {
    setSaving(true); setErr(''); setSaved(false)
    for (const [key, value] of Object.entries(draft)) {
      const { error } = await supabase.from('site_settings').upsert({ key, value }, { onConflict: 'key' })
      if (error) { setErr(`${key}: ${error.message}`); setSaving(false); return }
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
    // don't reload immediately — let admin see saved state, footer will read on next public load
  }

  const handleQuickSave = () => {
    if (!quickEdit || !quickEdit.name.trim() || !quickEdit.path.trim()) { setErr('Quick link name and path required (path must start with /)'); return }
    if (!quickEdit.path.startsWith('/')) { setErr('Path must start with / — e.g., /about'); return }
    const links = [...quickLinks]
    if (quickIdx !== null) links[quickIdx] = { name: quickEdit.name.trim(), path: quickEdit.path.trim() }
    else links.push({ name: quickEdit.name.trim(), path: quickEdit.path.trim() })
    saveQuickLinks(links)
    setQuickEdit(null); setQuickIdx(null)
  }

  const deleteQuick = (idx: number) => {
    if (!window.confirm(`Remove "${quickLinks[idx]!.name}" from footer?`)) return
    const links = [...quickLinks]; links.splice(idx, 1); saveQuickLinks(links)
  }

  if (loading) return <Skeletons count={4} />

  return (
    <div>
      <PageIntro
        title="Footer"
        description="Mirrors the public footer 1:1 — 4 columns (Brand, Quick Links, Services, Contact) + bottom bar. Edit text, links and visibility here; what you see below is what visitors see. Services footer is also controllable from Services admin — both stay in sync."
        action={<button onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-brand-green-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600 disabled:opacity-60">{saved ? <Check size={15} /> : null}{saving ? 'Saving…' : saved ? 'Saved!' : 'Save Footer'}</button>}
      />
      <ErrorBanner message={err} onDismiss={() => setErr('')} />

      <div className="mb-6 rounded-2xl border border-navy-100 bg-navy-50 p-4 text-sm">
        <p className="font-semibold text-navy">Live mirror — every footer detail is here. “Show in footer” = appears on site; uncheck = hidden. Edit a label/path and it decides what it opens.</p>
        <p className="mt-1 text-xs text-ink-light">Footer on public site reads these on every load — no rebuild. Toggle “Custom Procurement & Sourcing” in Services below and it will appear (footer now shows all flagged, no 6-limit).</p>
      </div>

      {/* Column visibility */}
      <section className="mb-6 rounded-[24px] border border-gray-100 bg-white p-6 shadow-soft md:p-8">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">Column visibility</h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            ['footer_show_brand', 'Brand column (logo, description, tagline, Download Profile, footer text)'],
            ['footer_show_quick_links', 'Quick Links column'],
            ['footer_show_services', 'Services column'],
            ['footer_show_contact', 'Contact column (email, phone, address)'],
            ['footer_show_socials', 'Social icons (inside Contact)'],
            ['footer_show_bottom', 'Bottom bar (© + Back to top)'],
          ].map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-mist/40 p-4">
              <span className="text-sm font-medium text-navy">{label}</span>
              <input type="checkbox" checked={(draft[key as keyof FooterDraft] as string) !== 'false'} onChange={(e) => setDraft({ ...draft, [key as keyof FooterDraft]: e.target.checked ? 'true' : 'false' } as unknown as FooterDraft)} className="h-4 w-4 accent-brand-green-500" />
            </label>
          ))}
        </div>
      </section>

      {/* Column headings — text + gold design (mirrors COT headings) */}
      <section className="mb-6 rounded-[24px] border border-gray-100 bg-white p-6 shadow-soft md:p-8">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">Column headings — text + design</h3>
        <p className="mt-1 text-xs text-ink-light">Same gold family as the “Ready to Simplify Your Procurement?” CTA headings. Rename any column; pick one style for all three — the footer mirrors instantly.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Quick Links heading</span><input value={draft.footer_quick_links_title} onChange={(e) => setDraft({ ...draft, footer_quick_links_title: e.target.value })} className={inputClass} placeholder="Quick Links" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Services heading</span><input value={draft.footer_services_title} onChange={(e) => setDraft({ ...draft, footer_services_title: e.target.value })} className={inputClass} placeholder="Services" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Contact heading</span><input value={draft.footer_contact_title} onChange={(e) => setDraft({ ...draft, footer_contact_title: e.target.value })} className={inputClass} placeholder="Contact" /></label>
        </div>
        <div className="mt-4"><FooterHeadingDesignCard /></div>
      </section>

      {/* Brand — mirrored */}
      <section className="mb-6 rounded-[24px] border border-gray-100 bg-white p-6 shadow-soft md:p-8">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">Brand column — mirrored</h3>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-navy ring-1 ring-gray-200">Logo is in Settings → Branding</span>
        </div>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Company description (brand paragraph)</span>
            <textarea rows={2} value={draft.company_description} onChange={(e) => setDraft({ ...draft, company_description: e.target.value })} className={`${inputClass} resize-none`} placeholder="Ghana's trusted partner..." />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Tagline pill</span>
            <input value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} className={inputClass} placeholder="One Partner. Endless Solutions." />
            <span className="mt-1 block text-[11px] text-gray-400">Shows as gold pill under description</span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Footer text (under Download Profile)</span>
            <textarea rows={2} value={draft.footer_text} onChange={(e) => setDraft({ ...draft, footer_text: e.target.value })} className={`${inputClass} resize-none`} placeholder="Simplifying procurement..." />
          </label>
        </div>
        <p className="mt-3 text-xs text-ink-light">Download Company Profile button opens the active Company Document (Admin → Downloads) — no footer toggle needed.</p>
      </section>

      {/* Quick Links — fully mirrored + editable destinations */}
      <section className="mb-6 rounded-[24px] border border-gray-100 bg-white p-6 shadow-soft md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">Quick Links column — mirrored</h3>
          <span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy ring-1 ring-navy-100">{quickLinks.length} links</span>
        </div>
        <p className="mt-1 text-xs text-ink-light">Each link’s label and path decides what it opens. Edit to change destination; reorder by deleting and re-adding. Uncheck via delete to hide.</p>
        <ul className="mt-4 space-y-2">
          {quickLinks.map((item, idx) => (
            <li key={`${item.path}-${idx}`} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-navy">{item.name}</span>
                <span className="flex items-center gap-1 text-xs text-gray-400"><ExternalLink size={12} /> {item.path}</span>
              </span>
              <button onClick={() => { setQuickEdit({ ...item }); setQuickIdx(idx) }} className="rounded-lg p-2 hover:bg-navy-50" aria-label={`Edit ${item.name}`}><Pencil size={14} /></button>
              <button onClick={() => deleteQuick(idx)} className="rounded-lg p-2 text-red-400 hover:bg-red-50" aria-label={`Delete ${item.name}`}><Trash2 size={14} /></button>
            </li>
          ))}
          {quickLinks.length === 0 && <li className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-ink-light">No Quick Links — footer column will be empty. Add one below.</li>}
        </ul>
        <button onClick={() => { setQuickEdit({ name: '', path: '/' }); setQuickIdx(null) }} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600"><Plus size={14} /> Add Quick Link</button>

        <Drawer open={!!quickEdit} onClose={() => { setQuickEdit(null); setQuickIdx(null) }} title={quickIdx !== null ? 'Edit Quick Link' : 'Add Quick Link'} subtitle="Decide what it opens — name is label, path is destination (must start with /).">
          {quickEdit && (
            <div className="space-y-4">
              <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Label *</span><input value={quickEdit.name} onChange={(e) => setQuickEdit({ ...quickEdit, name: e.target.value })} placeholder="e.g., About" className={inputClass} /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Path * — decides where it opens</span><input value={quickEdit.path} onChange={(e) => setQuickEdit({ ...quickEdit, path: e.target.value })} placeholder="/about" className={inputClass} /></label>
              <div className="rounded-xl bg-mist p-3 text-xs text-ink-light">Preview: <span className="font-semibold text-navy">{quickEdit.name || 'Label'}</span> → <span className="font-mono">{quickEdit.path || '/'}</span></div>
              <div className="flex gap-3 pt-2"><button onClick={handleQuickSave} className="flex-1 rounded-xl bg-brand-green-500 py-3 font-semibold text-white hover:bg-brand-green-600">Save Link</button><button onClick={() => { setQuickEdit(null); setQuickIdx(null) }} className="rounded-xl border px-6 py-3">Cancel</button></div>
            </div>
          )}
        </Drawer>
      </section>

      {/* Services — mirrored, no limit, decide destination via Services admin slug */}
      <section className="mb-6 rounded-[24px] border border-gray-100 bg-white p-6 shadow-soft md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">Services column — mirrored</h3>
          <span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy ring-1 ring-navy-100">{services.filter((s) => s.show_in_footer).length} in footer / {services.length} total</span>
        </div>
        <p className="mt-1 text-xs text-ink-light">Toggle any service — including <span className="font-semibold">Custom Procurement & Sourcing</span> — and it appears instantly (no 6-limit; footer shows all flagged, ordered by display_order). Edit name/path in Admin → Services; link opens <span className="font-mono">/services?highlight=slug</span>.</p>
        <ul className="mt-4 space-y-2">
          {services.map((svc) => (
            <li key={svc.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-navy">{svc.name} {!svc.published && <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px]">DRAFT</span>}</span>
                <span className="flex items-center gap-1 text-xs text-gray-400"><ExternalLink size={12} /> /services?highlight={svc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}</span>
              </span>
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input type="checkbox" checked={!!svc.show_in_footer} onChange={() => toggleServiceFooter(svc)} className="h-4 w-4 accent-gold-400" />
                <span className={svc.show_in_footer ? 'text-gold-600' : 'text-ink-light'}>{svc.show_in_footer ? 'In footer' : 'Show in footer'}</span>
              </label>
            </li>
          ))}
          {services.length === 0 && <li className="py-6 text-center text-sm text-ink-light">No services yet — add in Services admin.</li>}
        </ul>
      </section>

      {/* Contact — mirrored */}
      <section className="mb-6 rounded-[24px] border border-gray-100 bg-white p-6 shadow-soft md:p-8">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">Contact column — mirrored</h3>
        <p className="mt-1 text-xs text-ink-light">Edit what shows and what each item opens (mailto:/tel:). Social icons below.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Email — opens mailto:</span><input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className={inputClass} placeholder="gnabsolutions@gmail.com" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Phone — opens tel:</span><input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className={inputClass} placeholder="+233 55 427 3445" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Address — text only</span><input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} className={inputClass} placeholder="Accra Business District..." /></label>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            ['social_linkedin', 'LinkedIn URL'],
            ['social_facebook', 'Facebook URL'],
            ['social_twitter', 'X / Twitter URL'],
            ['social_instagram', 'Instagram URL'],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">{label} — decides where icon opens</span>
              <input value={(draft[key as keyof FooterDraft] as string) ?? ''} onChange={(e) => setDraft({ ...draft, [key as keyof FooterDraft]: e.target.value } as unknown as FooterDraft)} className={inputClass} placeholder="https://..." />
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-light">Leave a social URL empty to hide that icon even if “Social icons” is on. Icons open the URL you set.</p>
      </section>

      {/* Bottom */}
      <section className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-soft md:p-8">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">Bottom bar — mirrored</h3>
        <p className="mt-1 text-xs text-ink-light">Shows © year + company name and “Back to top”. Hidden when toggle off.</p>
        <div className="mt-4 flex gap-2">
          <button onClick={() => void save()} disabled={saving} className="rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 disabled:opacity-60">{saving ? 'Saving…' : saved ? 'Saved!' : 'Save Footer'}</button>
          <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-navy hover:border-navy"><Eye size={14} /> View site footer</a>
        </div>
      </section>

      <p className="mt-6 text-center text-xs text-ink-light">Footer reads these on every public load — Services footer also stays in sync with Admin → Services → Show in footer (same column, no conflict).</p>
    </div>
  )
}
