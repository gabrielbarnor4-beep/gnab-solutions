import { useCallback, useEffect, useState } from 'react'
import { Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageIntro } from '@/components/admin/AdminLayout'
import { ErrorBanner } from '@/components/admin/bits'
import { CtaDesignCard, GlobalHeroDesignCard, HomeHeroDesignCard } from '@/components/admin/DesignControls'
import { useSiteSettings } from '@/lib/siteData'
import { inputClass } from '@/components/ui'

type Tab = 'about' | 'services' | 'industries' | 'products' | 'process' | 'whyus' | 'contact' | 'quote' | 'supplier' | 'testimonials' | 'blog' | 'design'

const TABS: { id: Tab; label: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'industries', label: 'Industries' },
  { id: 'products', label: 'Products' },
  { id: 'process', label: 'Process' },
  { id: 'whyus', label: 'Why Us' },
  { id: 'contact', label: 'Contact' },
  { id: 'quote', label: 'Quote' },
  { id: 'supplier', label: 'Supplier' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'blog', label: 'Blog' },
  { id: 'design', label: '✨ Design' },
]

const FIELDS: Record<Exclude<Tab, 'design'>, { key: string; label: string; type?: 'textarea'; placeholder?: string }[]> = {
  about: [
    { key: 'about_hero_title', label: 'Hero Title' },
    { key: 'about_hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
    { key: 'about_story_eyebrow', label: 'Story Eyebrow' },
    { key: 'about_story_title', label: 'Story Title' },
    { key: 'about_story_p1', label: 'Story Paragraph 1', type: 'textarea' },
    { key: 'about_story_p2', label: 'Story Paragraph 2', type: 'textarea' },
    { key: 'about_mission_title', label: 'Mission Title' },
    { key: 'about_mission_desc', label: 'Mission Description', type: 'textarea' },
    { key: 'about_vision_title', label: 'Vision Title' },
    { key: 'about_vision_desc', label: 'Vision Description', type: 'textarea' },
    { key: 'about_values_eyebrow', label: 'Values Eyebrow' },
    { key: 'about_values_title', label: 'Values Title' },
    { key: 'about_values_subtitle', label: 'Values Subtitle', type: 'textarea' },
    { key: 'about_cta_eyebrow', label: 'CTA Eyebrow' },
    { key: 'about_cta_title', label: 'CTA Title' },
    { key: 'about_cta_title_highlight', label: 'CTA Title Highlight (gold)' },
    { key: 'about_cta_feature1', label: 'CTA Feature 1' },
    { key: 'about_cta_feature2', label: 'CTA Feature 2' },
    { key: 'about_cta_feature3', label: 'CTA Feature 3' },
    { key: 'about_cta_subtitle', label: 'CTA Subtitle', type: 'textarea' },
    { key: 'about_cta_primary_label', label: 'CTA Primary Button' },
    { key: 'about_cta_secondary_label', label: 'CTA Secondary Button' },
  ],
  services: [
    { key: 'services_hero_title', label: 'Hero Title' },
    { key: 'services_hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
    { key: 'services_section_eyebrow', label: 'Section Eyebrow' },
    { key: 'services_section_title', label: 'Section Title' },
    { key: 'services_section_subtitle', label: 'Section Subtitle', type: 'textarea' },
    { key: 'services_cta_eyebrow', label: 'CTA Eyebrow' },
    { key: 'services_cta_title', label: 'CTA Title' },
    { key: 'services_cta_title_highlight', label: 'CTA Title Highlight (gold)' },
    { key: 'services_cta_feature1', label: 'CTA Feature 1' },
    { key: 'services_cta_feature2', label: 'CTA Feature 2' },
    { key: 'services_cta_feature3', label: 'CTA Feature 3' },
    { key: 'services_cta_subtitle', label: 'CTA Subtitle', type: 'textarea' },
    { key: 'services_cta_primary_label', label: 'CTA Primary Button' },
    { key: 'services_cta_secondary_label', label: 'CTA Secondary Button' },
  ],
  industries: [
    { key: 'industries_hero_title', label: 'Hero Title' },
    { key: 'industries_hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
    { key: 'industries_cta_eyebrow', label: 'CTA Eyebrow' },
    { key: 'industries_cta_title', label: 'CTA Title' },
    { key: 'industries_cta_title_highlight', label: 'CTA Title Highlight (gold)' },
    { key: 'industries_cta_feature1', label: 'CTA Feature 1' },
    { key: 'industries_cta_feature2', label: 'CTA Feature 2' },
    { key: 'industries_cta_feature3', label: 'CTA Feature 3' },
    { key: 'industries_cta_subtitle', label: 'CTA Subtitle', type: 'textarea' },
    { key: 'industries_cta_primary_label', label: 'CTA Primary Button' },
    { key: 'industries_cta_secondary_label', label: 'CTA Secondary Button' },
  ],
  products: [
    { key: 'products_hero_title', label: 'Hero Title' },
    { key: 'products_hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
    { key: 'products_search_placeholder', label: 'Search Placeholder' },
    { key: 'products_empty_title', label: 'Empty Title' },
    { key: 'products_empty_desc', label: 'Empty Description', type: 'textarea' },
    { key: 'products_cta_eyebrow', label: 'CTA Eyebrow' },
    { key: 'products_cta_title', label: 'CTA Title' },
    { key: 'products_cta_title_highlight', label: 'CTA Title Highlight (gold)' },
    { key: 'products_cta_feature1', label: 'CTA Feature 1' },
    { key: 'products_cta_feature2', label: 'CTA Feature 2' },
    { key: 'products_cta_feature3', label: 'CTA Feature 3' },
    { key: 'products_cta_subtitle', label: 'CTA Subtitle', type: 'textarea' },
    { key: 'products_cta_primary_label', label: 'CTA Primary Button' },
    { key: 'products_cta_secondary_label', label: 'CTA Secondary Button' },
  ],
  process: [
    { key: 'process_hero_title', label: 'Hero Title' },
    { key: 'process_hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
    { key: 'process_cta_eyebrow', label: 'CTA Eyebrow' },
    { key: 'process_cta_title', label: 'CTA Title' },
    { key: 'process_cta_title_highlight', label: 'CTA Title Highlight (gold)' },
    { key: 'process_cta_feature1', label: 'CTA Feature 1' },
    { key: 'process_cta_feature2', label: 'CTA Feature 2' },
    { key: 'process_cta_feature3', label: 'CTA Feature 3' },
    { key: 'process_cta_subtitle', label: 'CTA Subtitle', type: 'textarea' },
    { key: 'process_cta_primary_label', label: 'CTA Primary Button' },
    { key: 'process_cta_secondary_label', label: 'CTA Secondary Button' },
  ],
  whyus: [
    { key: 'whyus_hero_title', label: 'Hero Title' },
    { key: 'whyus_hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
    { key: 'whyus_comparison_typical_title', label: 'Comparison — Typical Title' },
    { key: 'whyus_comparison_gnab_title', label: 'Comparison — GNAB Title' },
    { key: 'whyus_cta_eyebrow', label: 'CTA Eyebrow' },
    { key: 'whyus_cta_title', label: 'CTA Title' },
    { key: 'whyus_cta_title_highlight', label: 'CTA Title Highlight (gold)' },
    { key: 'whyus_cta_feature1', label: 'CTA Feature 1' },
    { key: 'whyus_cta_feature2', label: 'CTA Feature 2' },
    { key: 'whyus_cta_feature3', label: 'CTA Feature 3' },
    { key: 'whyus_cta_subtitle', label: 'CTA Subtitle', type: 'textarea' },
    { key: 'whyus_cta_primary_label', label: 'CTA Primary Button' },
    { key: 'whyus_cta_secondary_label', label: 'CTA Secondary Button' },
  ],
  contact: [
    { key: 'contact_hero_title', label: 'Hero Title' },
    { key: 'contact_hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
    { key: 'contact_get_in_touch_title', label: 'Get in Touch Title' },
    { key: 'contact_get_in_touch_desc', label: 'Get in Touch Description', type: 'textarea' },
    { key: 'contact_form_title', label: 'Form Title' },
    { key: 'contact_form_subtitle', label: 'Form Subtitle' },
    { key: 'contact_form_success_title', label: 'Success Title' },
    { key: 'contact_form_success_desc', label: 'Success Description', type: 'textarea' },
  ],
  quote: [
    { key: 'quote_hero_title', label: 'Hero Title' },
    { key: 'quote_hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
    { key: 'quote_how_it_works_title', label: 'How It Works Title' },
    { key: 'quote_form_title', label: 'Form Title' },
  ],
  supplier: [
    { key: 'supplier_hero_title', label: 'Hero Title' },
    { key: 'supplier_hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
    { key: 'supplier_intro_desc', label: 'Intro Description', type: 'textarea' },
  ],
  testimonials: [
    { key: 'testimonials_hero_title', label: 'Hero Title' },
    { key: 'testimonials_hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
    { key: 'testimonials_share_title', label: 'Share Title' },
  ],
  blog: [
    { key: 'blog_hero_title', label: 'Hero Title' },
    { key: 'blog_hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
  ],
}

const JSON_KEYS = new Set(['about_pillars','about_values_cards','process_guarantee','whyus_comparison_typical_bullets','whyus_comparison_gnab_bullets'])

export default function PagesAdminPage() {
  const settings = useSiteSettings()
  const [tab, setTab] = useState<Tab>('about')
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const keys = Object.values(FIELDS).flat().map((f) => f.key).concat([...JSON_KEYS])
    const { data } = await supabase.from('site_settings').select('key, value').in('key', keys)
    const map: Record<string, string> = {}
    data?.forEach((r) => (map[r.key] = r.value))
    const next: Record<string, string> = {}
    for (const k of keys) {
      next[k] = map[k] ?? (settings as any)[k] ?? ''
    }
    // Include JSON keys with pretty print for editing
    for (const k of JSON_KEYS) {
      const v = map[k] ?? (settings as any)[k] ?? ''
      try { next[k] = JSON.stringify(JSON.parse(v), null, 2) } catch { next[k] = v }
    }
    setDraft(next)
    setLoading(false)
  }, [settings])

  useEffect(() => { document.title = 'Site Pages | GNAB Admin'; void load() }, [load])

  const save = async () => {
    setSaving(true); setErr(''); setSaved(false)
    // Validate JSON keys
    for (const k of JSON_KEYS) {
      const v = draft[k]
      if (!v) continue
      try { JSON.parse(v) } catch { setErr(`${k} is not valid JSON`); setSaving(false); return }
    }
    for (const [key, value] of Object.entries(draft)) {
      // For JSON keys, store minified
      let toSave = value
      if (JSON_KEYS.has(key)) {
        try { toSave = JSON.stringify(JSON.parse(value)) } catch { /* keep as is */ }
      }
      const { error } = await supabase.from('site_settings').upsert({ key, value: toSave }, { onConflict: 'key' })
      if (error) { setErr(`${key}: ${error.message}`); setSaving(false); return }
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
    window.location.reload()
  }

  if (loading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-mist" />)}</div>

  return (
    <div>
      <PageIntro
        title="Site Pages"
        description="Edit any text on any public page — hero, section headings, paragraphs, feature cards and more. Mirrored 1:1 to the public site; save and the page updates instantly. For feature cards that have their own admin (Services, Industries, Products, Process, Why Us), edit cards there; edit page chrome here."
        action={<button onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-brand-green-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600 disabled:opacity-60">{saving ? 'Saving…' : saved ? 'Saved!' : 'Save Page'}</button>}
      />
      {err && <ErrorBanner message={err} onDismiss={() => setErr('')} />}

      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-soft">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === t.id ? 'bg-navy text-white shadow' : 'bg-mist text-ink-light hover:bg-navy-50 hover:text-navy'}`}>{t.label}</button>
        ))}
      </div>

      <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-soft md:p-8">
        {tab === 'design' ? (
          <div className="space-y-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-navy">Heading & CTA Design</h3>
              <span className="rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-600">Live on every page</span>
            </div>
            <p className="text-sm leading-relaxed text-ink-light">
              One choice styles the Home hero, every inner page hero, every CTA card (Home “Ready to Simplify Your Procurement?” design),
              and the shared eyebrow language. Each control saves to <span className="font-mono">site_settings</span> instantly — the public site mirrors it on next visit.
            </p>
            <HomeHeroDesignCard />
            <GlobalHeroDesignCard />
            <CtaDesignCard />
            <div className="rounded-2xl bg-mist p-4 text-xs leading-relaxed text-ink-light">
              <p className="font-semibold text-navy">Where each option appears</p>
              <p className="mt-1">Home hero → <span className="font-mono">/</span> top. Inner heroes → About, Services, Industries, Products, Process, Why Us, Contact, Quote, Supplier, Testimonials, Blog. CTA card → Home bottom + About, Services, Industries, Products, Process, Why Us bottoms. Per-page CTA gold highlight words are edited on each page tab above (CTA Title Highlight).</p>
            </div>
          </div>
        ) : (
        <>
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-navy">{TABS.find((t) => t.id === tab)?.label} — Page Content</h3>
          <a href={tab === 'about' ? '/about' : tab === 'services' ? '/services' : tab === 'industries' ? '/industries' : tab === 'products' ? '/products' : tab === 'process' ? '/process' : tab === 'whyus' ? '/why-us' : tab === 'contact' ? '/contact' : tab === 'quote' ? '/quote' : tab === 'supplier' ? '/supplier-registration' : tab === 'testimonials' ? '/testimonials' : '/blog'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-navy hover:border-navy"><Eye size={12} /> View page</a>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {(FIELDS[tab as Exclude<Tab, 'design'>] ?? []).map((f) => (
            <label key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-light">{f.label} <span className="font-mono text-[10px] text-gray-400">({f.key})</span></span>
              {f.type === 'textarea' ? (
                <textarea rows={3} value={draft[f.key] ?? ''} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} placeholder={f.placeholder} className={`${inputClass} resize-none`} />
              ) : (
                <input value={draft[f.key] ?? ''} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} placeholder={f.placeholder} className={inputClass} />
              )}
            </label>
          ))}
        </div>

        {JSON_KEYS.has(((FIELDS[tab as Exclude<Tab, 'design'>]?.[0]?.key ?? '') as string)) || tab === 'about' || tab === 'process' || tab === 'whyus' ? (
          <div className="mt-8 space-y-4">
            {[...JSON_KEYS].filter((k) => k.startsWith(tab === 'whyus' ? 'whyus' : tab)).map((k) => (
              <label key={k} className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-light">{k} (JSON array)</span>
                <textarea rows={4} value={draft[k] ?? ''} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} className={`${inputClass} resize-none font-mono text-xs`} placeholder='[{"value":"100+","label":"..."}]' />
                <span className="mt-1 block text-xs text-gray-400">Edit as JSON — must be valid array. Feature cards especially.</span>
              </label>
            ))}
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl bg-mist p-4 text-xs leading-relaxed text-ink-light">
          <p className="font-semibold text-navy">How mirroring works</p>
          <p className="mt-1">Public pages read <span className="font-mono">site_settings.{'{key}'}</span> via <span className="font-mono">useSiteSettings()</span> with hardcoded fallback. Saving here does <span className="font-mono">upsert site_settings</span> then reloads — no rebuild, no conflict with Home/Services/Industries/etc. admins (they edit their own tables; this edits page chrome). CTA Title Highlight renders in gold gradient like Home “Your Procurement?”.</p>
        </div>

        <button onClick={() => void save()} disabled={saving} className="mt-6 w-full rounded-xl bg-brand-green-500 py-3 font-semibold text-white hover:bg-brand-green-600 disabled:opacity-60">{saving ? 'Saving…' : saved ? 'Saved — page updated!' : 'Save Page'}</button>
        </>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-ink-light">Tip: For feature cards (Services, Industries, Products, Process, Why Us) edit cards in their dedicated Admin pages for full CRUD; edit only the page chrome (hero, headings) here.</p>
    </div>
  )
}
