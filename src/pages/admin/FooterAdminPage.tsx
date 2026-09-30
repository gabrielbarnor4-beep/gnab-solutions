import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Check, ExternalLink, Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageIntro } from '@/components/admin/AdminLayout'
import { Drawer, ErrorBanner, Skeletons } from '@/components/admin/bits'
import { ALL_FOOTER_LINK_DEFS, parseFooterContactItems, parseFooterQuickLinks, useSiteSettings, type FooterContactItem, type FooterContactKind, type FooterQuickLink } from '@/lib/siteData'
import { FooterHeadingDesignCard } from '@/components/admin/DesignControls'
import { inputClass } from '@/components/ui'

type FooterDraft = {
  footer_show_brand: string
  footer_show_quick_links: string
  footer_quick_links: string
  footer_show_services: string
  footer_show_contact: string
  footer_contact_items: string
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

const CONTACT_KINDS: { value: FooterContactKind; label: string; hint: string }[] = [
  { value: 'email', label: 'Email', hint: 'opens mailto:' },
  { value: 'phone', label: 'Phone', hint: 'opens tel:' },
  { value: 'whatsapp', label: 'WhatsApp', hint: 'number or wa.me link — opens chat' },
  { value: 'address', label: 'Address', hint: 'text only' },
  { value: 'hours', label: 'Opening hours', hint: 'text only, e.g. Mon–Fri 8:00–17:00' },
  { value: 'link', label: 'Custom link', hint: 'any https:// URL — opens new tab' },
  { value: 'text', label: 'Plain text', hint: 'any extra line' },
]

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export default function FooterAdminPage() {
  const settings = useSiteSettings()
  const [draft, setDraft] = useState<FooterDraft>({
    footer_show_brand: 'true',
    footer_show_quick_links: 'true',
    footer_quick_links: '[]',
    footer_show_services: 'true',
    footer_show_contact: 'true',
    footer_contact_items: '[]',
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
  const [quickEdit, setQuickEdit] = useState<FooterQuickLink | null>(null)
  const [quickIdx, setQuickIdx] = useState<number | null>(null)
  const [contactEdit, setContactEdit] = useState<FooterContactItem | null>(null)
  const [contactIdx, setContactIdx] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const keys = ['footer_show_brand','footer_show_quick_links','footer_quick_links','footer_show_services','footer_show_contact','footer_contact_items','footer_show_socials','footer_show_bottom','footer_quick_links_title','footer_services_title','footer_contact_title','footer_text','company_description','tagline','email','phone','address','social_linkedin','social_facebook','social_twitter','social_instagram']
    const { data } = await supabase.from('site_settings').select('key, value').in('key', keys)
    const map: Record<string, string> = {}
    data?.forEach((r) => (map[r.key] = r.value))
    // Quick links: shared parser keeps legacy string[] + object[] in sync with public footer
    const rawQuick = map.footer_quick_links ?? (settings as unknown as { footer_quick_links?: string }).footer_quick_links ?? ''
    const quickLinks = parseFooterQuickLinks(rawQuick)
    // Contact items: seed from legacy email/phone/address on first run so nothing disappears
    let contactItems = parseFooterContactItems(map.footer_contact_items ?? (settings as unknown as { footer_contact_items?: string }).footer_contact_items)
    if (contactItems.length === 0) {
      const email = map.email ?? settings.email ?? ''
      const phone = map.phone ?? settings.phone ?? ''
      const address = map.address ?? settings.address ?? ''
      contactItems = [
        { id: 'email', kind: 'email' as const, label: 'Email', value: email, visible: true },
        { id: 'phone', kind: 'phone' as const, label: 'Phone', value: phone, visible: true },
        { id: 'address', kind: 'address' as const, label: 'Address', value: address, visible: true },
      ]
    }
    setDraft({
      footer_show_brand: map.footer_show_brand ?? (settings.footer_show_brand ?? 'true'),
      footer_show_quick_links: map.footer_show_quick_links ?? (settings.footer_show_quick_links ?? 'true'),
      footer_quick_links: JSON.stringify(quickLinks),
      footer_show_services: map.footer_show_services ?? (settings.footer_show_services ?? 'true'),
      footer_show_contact: map.footer_show_contact ?? (settings.footer_show_contact ?? 'true'),
      footer_contact_items: JSON.stringify(contactItems),
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
  }, [settings.footer_show_brand, settings.footer_show_quick_links, settings.footer_quick_links, settings.footer_show_services, settings.footer_show_contact, settings.footer_quick_links_title, settings.footer_services_title, settings.footer_contact_title, settings.footer_text, settings.company_description, settings.tagline, settings.email, settings.phone, settings.address, settings.social_linkedin, settings.social_facebook, settings.social_twitter, settings.social_instagram])

  useEffect(() => { document.title = 'Footer | GNAB Admin'; void load() }, [load])

  const quickLinks = parseFooterQuickLinks(draft.footer_quick_links)
  const contactItems = parseFooterContactItems(draft.footer_contact_items)
  const visibleQuick = quickLinks.filter((l) => l.visible !== false).length

  const saveQuickLinks = (links: FooterQuickLink[]) => {
    setDraft({ ...draft, footer_quick_links: JSON.stringify(links) })
  }

  const toggleQuick = (idx: number) => {
    const links = [...quickLinks]
    links[idx] = { ...links[idx]!, visible: !(links[idx]!.visible !== false) }
    saveQuickLinks(links)
  }

  const moveQuick = (idx: number, dir: -1 | 1) => {
    const j = idx + dir
    if (j < 0 || j >= quickLinks.length) return
    const links = [...quickLinks]
    const [item] = links.splice(idx, 1)
    links.splice(j, 0, item!)
    saveQuickLinks(links)
  }

  const saveContactItems = (items: FooterContactItem[]) => {
    setDraft({ ...draft, footer_contact_items: JSON.stringify(items) })
  }

  const toggleContact = (idx: number) => {
    const items = [...contactItems]
    items[idx] = { ...items[idx]!, visible: !(items[idx]!.visible !== false) }
    saveContactItems(items)
  }

  const moveContact = (idx: number, dir: -1 | 1) => {
    const j = idx + dir
    if (j < 0 || j >= contactItems.length) return
    const items = [...contactItems]
    const [item] = items.splice(idx, 1)
    items.splice(j, 0, item!)
    saveContactItems(items)
  }

  const toggleServiceFooter = async (svc: { id: string; show_in_footer: boolean }) => {
    const { error } = await supabase.from('services').update({ show_in_footer: !svc.show_in_footer }).eq('id', svc.id)
    if (error) setErr(error.message); else void load()
  }

  const save = async () => {
    setSaving(true); setErr(''); setSaved(false)
    // Keep legacy email/phone/address in sync with the managed contact items so
    // older surfaces (contact page fallbacks) never drift from the footer.
    const items = parseFooterContactItems(draft.footer_contact_items)
    const pick = (kind: string) => items.find((i) => i.kind === kind && i.visible !== false && i.value.trim())?.value.trim() ?? items.find((i) => i.kind === kind)?.value.trim() ?? ''
    const payload: Record<string, string> = {
      ...draft,
      email: pick('email') || draft.email,
      phone: pick('phone') || draft.phone,
      address: pick('address') || draft.address,
    }
    for (const [key, value] of Object.entries(payload)) {
      const { error } = await supabase.from('site_settings').upsert({ key, value }, { onConflict: 'key' })
      if (error) { setErr(`${key}: ${error.message}`); setSaving(false); return }
    }
    setDraft((d) => ({ ...d, email: payload.email ?? d.email, phone: payload.phone ?? d.phone, address: payload.address ?? d.address }))
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
    // don't reload immediately — let admin see saved state, footer will read on next public load
  }

  const handleQuickSave = () => {
    if (!quickEdit || !quickEdit.name.trim() || !quickEdit.path.trim()) { setErr('Quick link name and path required (path must start with /)'); return }
    if (!quickEdit.path.startsWith('/')) { setErr('Path must start with / — e.g., /about'); return }
    const links = [...quickLinks]
    const row: FooterQuickLink = { name: quickEdit.name.trim(), path: quickEdit.path.trim(), visible: quickEdit.visible !== false }
    if (quickIdx !== null) links[quickIdx] = row
    else links.push(row)
    saveQuickLinks(links)
    setQuickEdit(null); setQuickIdx(null)
  }

  const deleteQuick = (idx: number) => {
    if (!window.confirm(`Remove "${quickLinks[idx]!.name}" from footer?`)) return
    const links = [...quickLinks]; links.splice(idx, 1); saveQuickLinks(links)
  }

  const restoreDefaults = () => {
    if (!window.confirm('Reset Quick Links to the default 11 (Home → Become a Supplier, all visible)?')) return
    saveQuickLinks(ALL_FOOTER_LINK_DEFS.map((l) => ({ ...l, visible: true })))
  }

  const handleContactSave = () => {
    if (!contactEdit || !contactEdit.value.trim()) { setErr('Contact item value is required'); return }
    if ((contactEdit.kind === 'link' || contactEdit.kind === 'email') && contactEdit.kind === 'link' && !/^https?:\/\//.test(contactEdit.value.trim()) && !contactEdit.value.trim().startsWith('/')) { setErr('Custom link must start with https:// or /'); return }
    const items = [...contactItems]
    const row: FooterContactItem = {
      id: contactEdit.id || uid(),
      kind: contactEdit.kind,
      label: contactEdit.label.trim() || contactEdit.kind,
      value: contactEdit.value.trim(),
      visible: contactEdit.visible !== false,
    }
    if (contactIdx !== null) items[contactIdx] = row
    else items.push(row)
    saveContactItems(items)
    setContactEdit(null); setContactIdx(null)
  }

  const deleteContact = (idx: number) => {
    if (!window.confirm(`Remove "${contactItems[idx]!.label}" from footer contact column?`)) return
    const items = [...contactItems]; items.splice(idx, 1); saveContactItems(items)
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
            ['footer_show_contact', 'Contact column (your custom items below)'],
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

      {/* Quick Links — per-item toggles decide what appears */}
      <section className="mb-6 rounded-[24px] border border-gray-100 bg-white p-6 shadow-soft md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">Quick Links column — mirrored</h3>
          <span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy ring-1 ring-navy-100">{visibleQuick} visible / {quickLinks.length} total</span>
        </div>
        <p className="mt-1 text-xs text-ink-light">Toggle each link to decide what appears under Quick Links — including Reviews (/testimonials) and Become a Supplier. Order here = order on site. Hidden items stay saved but don’t show.</p>
        <ul className="mt-4 space-y-2">
          {quickLinks.map((item, idx) => {
            const visible = item.visible !== false
            return (
              <li key={`${item.path}-${idx}`} className={`flex items-center gap-3 rounded-xl border p-3 ${visible ? 'border-gray-100 bg-white' : 'border-dashed border-gray-200 bg-mist/50 opacity-75'}`}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-navy">{item.name} {!visible && <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase">Hidden</span>}</span>
                  <span className="flex items-center gap-1 text-xs text-gray-400"><ExternalLink size={12} /> {item.path}</span>
                </span>
                <span className="flex items-center gap-1">
                  <button onClick={() => moveQuick(idx, -1)} disabled={idx === 0} aria-label={`Move ${item.name} up`} className="rounded-lg p-2 hover:bg-navy-50 disabled:opacity-25"><ArrowUp size={14} /></button>
                  <button onClick={() => moveQuick(idx, 1)} disabled={idx === quickLinks.length - 1} aria-label={`Move ${item.name} down`} className="rounded-lg p-2 hover:bg-navy-50 disabled:opacity-25"><ArrowDown size={14} /></button>
                </span>
                <label className="flex cursor-pointer items-center gap-2 rounded-full px-2 py-1 text-xs font-bold uppercase tracking-wide" title={visible ? 'Visible on site — click to hide' : 'Hidden — click to show'}>
                  <input type="checkbox" checked={visible} onChange={() => toggleQuick(idx)} className="h-4 w-4 accent-brand-green-500" />
                  <span className={visible ? 'text-brand-green-700' : 'text-ink-light'}>{visible ? 'Shown' : 'Hidden'}</span>
                </label>
                <button onClick={() => { setQuickEdit({ ...item }); setQuickIdx(idx) }} className="rounded-lg p-2 hover:bg-navy-50" aria-label={`Edit ${item.name}`}><Pencil size={14} /></button>
                <button onClick={() => deleteQuick(idx)} className="rounded-lg p-2 text-red-400 hover:bg-red-50" aria-label={`Delete ${item.name}`}><Trash2 size={14} /></button>
              </li>
            )
          })}
          {quickLinks.length === 0 && <li className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-ink-light">No Quick Links — footer column will be empty. Add one below.</li>}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => { setQuickEdit({ name: '', path: '/', visible: true }); setQuickIdx(null) }} className="inline-flex items-center gap-2 rounded-xl bg-brand-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600"><Plus size={14} /> Add Quick Link</button>
          <button onClick={restoreDefaults} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-ink-light hover:border-navy hover:text-navy">Restore defaults (11)</button>
        </div>

        <Drawer open={!!quickEdit} onClose={() => { setQuickEdit(null); setQuickIdx(null) }} title={quickIdx !== null ? 'Edit Quick Link' : 'Add Quick Link'} subtitle="Decide what it opens — name is label, path is destination (must start with /). Toggle decides if it appears.">
          {quickEdit && (
            <div className="space-y-4">
              <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Label *</span><input value={quickEdit.name} onChange={(e) => setQuickEdit({ ...quickEdit, name: e.target.value })} placeholder="e.g., Reviews" className={inputClass} /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Path * — decides where it opens</span><input value={quickEdit.path} onChange={(e) => setQuickEdit({ ...quickEdit, path: e.target.value })} placeholder="/testimonials" className={inputClass} /></label>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-mist/40 p-4">
                <span className="text-sm font-medium text-navy">Show in footer (toggle)</span>
                <input type="checkbox" checked={quickEdit.visible !== false} onChange={(e) => setQuickEdit({ ...quickEdit, visible: e.target.checked })} className="h-4 w-4 accent-brand-green-500" />
              </label>
              <div className="rounded-xl bg-mist p-3 text-xs text-ink-light">Preview: <span className="font-semibold text-navy">{quickEdit.name || 'Label'}</span> → <span className="font-mono">{quickEdit.path || '/'}</span> {(quickEdit.visible !== false) ? '(shown)' : '(hidden)'}</div>
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
        <p className="mt-1 text-xs text-ink-light">Toggle any service — including <span className="font-semibold">Automobile Services & Spares</span> and <span className="font-semibold">Custom Procurement & Sourcing</span> — and it appears instantly (no 6-limit; footer shows all flagged, ordered by display_order). Edit name/path in Admin → Services; link opens <span className="font-mono">/services?highlight=slug</span>.</p>
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

      {/* Contact — fully managed items with toggles + order */}
      <section className="mb-6 rounded-[24px] border border-gray-100 bg-white p-6 shadow-soft md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">Contact column — mirrored</h3>
          <span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy ring-1 ring-navy-100">{contactItems.filter((c) => c.visible !== false).length} visible / {contactItems.length} total</span>
        </div>
        <p className="mt-1 text-xs text-ink-light">Add as many items as you need — each has its own toggle and position decides how it appears top-to-bottom on the site. Email opens mailto:, phone opens tel:, WhatsApp opens chat, links open URLs.</p>
        <ul className="mt-4 space-y-2">
          {contactItems.map((item, idx) => {
            const visible = item.visible !== false
            const kindLabel = CONTACT_KINDS.find((k) => k.value === item.kind)?.label ?? item.kind
            return (
              <li key={item.id} className={`flex items-center gap-3 rounded-xl border p-3 ${visible ? 'border-gray-100 bg-white' : 'border-dashed border-gray-200 bg-mist/50 opacity-75'}`}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-navy">{item.label} <span className="ml-1 rounded-full bg-mist px-2 py-0.5 text-[10px] font-bold uppercase text-ink-light">{kindLabel}</span> {!visible && <span className="ml-1 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase">Hidden</span>}</span>
                  <span className="block truncate text-xs text-gray-400">{item.value}</span>
                </span>
                <span className="flex items-center gap-1">
                  <button onClick={() => moveContact(idx, -1)} disabled={idx === 0} aria-label={`Move ${item.label} up`} className="rounded-lg p-2 hover:bg-navy-50 disabled:opacity-25"><ArrowUp size={14} /></button>
                  <button onClick={() => moveContact(idx, 1)} disabled={idx === contactItems.length - 1} aria-label={`Move ${item.label} down`} className="rounded-lg p-2 hover:bg-navy-50 disabled:opacity-25"><ArrowDown size={14} /></button>
                </span>
                <label className="flex cursor-pointer items-center gap-2 rounded-full px-2 py-1 text-xs font-bold uppercase tracking-wide" title={visible ? 'Visible on site — click to hide' : 'Hidden — click to show'}>
                  <input type="checkbox" checked={visible} onChange={() => toggleContact(idx)} className="h-4 w-4 accent-brand-green-500" />
                  <span className={visible ? 'text-brand-green-700' : 'text-ink-light'}>{visible ? 'Shown' : 'Hidden'}</span>
                </label>
                <button onClick={() => { setContactEdit({ ...item }); setContactIdx(idx) }} className="rounded-lg p-2 hover:bg-navy-50" aria-label={`Edit ${item.label}`}><Pencil size={14} /></button>
                <button onClick={() => deleteContact(idx)} className="rounded-lg p-2 text-red-400 hover:bg-red-50" aria-label={`Delete ${item.label}`}><Trash2 size={14} /></button>
              </li>
            )
          })}
          {contactItems.length === 0 && <li className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-ink-light">No contact items — footer column will be empty. Add one below.</li>}
        </ul>
        <button onClick={() => { setContactEdit({ id: '', kind: 'text', label: '', value: '', visible: true }); setContactIdx(null) }} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600"><Plus size={14} /> Add Contact Item</button>

        <Drawer open={!!contactEdit} onClose={() => { setContactEdit(null); setContactIdx(null) }} title={contactIdx !== null ? 'Edit Contact Item' : 'Add Contact Item'} subtitle="Type decides icon + what it opens. Toggle decides if it appears. Order in the list = order on site.">
          {contactEdit && (
            <div className="space-y-4">
              <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Type * — decides icon + behaviour</span>
                <select value={contactEdit.kind} onChange={(e) => setContactEdit({ ...contactEdit, kind: e.target.value as FooterContactKind })} className={inputClass}>
                  {CONTACT_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label} — {k.hint}</option>)}
                </select>
              </label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Label (admin only)</span><input value={contactEdit.label} onChange={(e) => setContactEdit({ ...contactEdit, label: e.target.value })} placeholder="e.g., WhatsApp, Head Office, Mon–Fri" className={inputClass} /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-light">Value * — what shows + opens</span>
                <input value={contactEdit.value} onChange={(e) => setContactEdit({ ...contactEdit, value: e.target.value })} placeholder={contactEdit.kind === 'email' ? 'gnabsolutions@gmail.com' : contactEdit.kind === 'phone' ? '+233 55 427 3445' : contactEdit.kind === 'link' ? 'https://...' : 'Type the text to show…'} className={inputClass} />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-mist/40 p-4">
                <span className="text-sm font-medium text-navy">Show in footer (toggle)</span>
                <input type="checkbox" checked={contactEdit.visible !== false} onChange={(e) => setContactEdit({ ...contactEdit, visible: e.target.checked })} className="h-4 w-4 accent-brand-green-500" />
              </label>
              <div className="flex gap-3 pt-2"><button onClick={handleContactSave} className="flex-1 rounded-xl bg-brand-green-500 py-3 font-semibold text-white hover:bg-brand-green-600">Save Item</button><button onClick={() => { setContactEdit(null); setContactIdx(null) }} className="rounded-xl border px-6 py-3">Cancel</button></div>
            </div>
          )}
        </Drawer>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
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
