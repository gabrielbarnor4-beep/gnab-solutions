import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { inputClass } from '@/components/ui'
import { CTA_THEMES, DESIGN_LABELS, EYEBROW_STYLES, FOOTER_HEADING_STYLES, HERO_ALIGNS, TITLE_SIZES } from '@/lib/design'

export function useSiteSetting(key: string) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('site_settings').select('value').eq('key', key).maybeSingle()
    if ((data as { value?: string } | null)?.value != null) setValue(String((data as { value?: string }).value))
    setLoading(false)
  }, [key])
  useEffect(() => { void load() }, [load])
  const save = useCallback(
    async (next: string) => {
      setValue(next)
      setSaving(true)
      await supabase.from('site_settings').upsert({ key, value: next }, { onConflict: 'key' })
      setSaving(false)
    },
    [key],
  )
  return { value, loading, saving, save, setValue }
}

export function DesignSelect({
  settingKey,
  label,
  options,
  hint,
  fallback = '',
}: {
  settingKey: string
  label: string
  options: readonly string[]
  hint?: string
  fallback?: string
}) {
  const { value, loading, saving, save } = useSiteSetting(settingKey)
  const current = value || fallback || options[0]!
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-ink-light">
        {label}
        {saving && <span className="text-[11px] font-normal normal-case text-gray-400">Saving…</span>}
      </span>
      <select
        value={current}
        disabled={loading}
        onChange={(e) => void save(e.target.value)}
        className={inputClass}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {DESIGN_LABELS[o] ?? o}
          </option>
        ))}
      </select>
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  )
}

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gold-200 bg-gold-50/40 p-5">
      <p className="font-display text-sm font-bold text-navy">{title}</p>
      <p className="mb-4 mt-1 text-xs leading-relaxed text-ink-light">{desc}</p>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </div>
  )
}

export function HomeHeroDesignCard() {
  return (
    <Card title="Hero heading design" desc="Premium heading options for the Home hero. Saved to site_settings instantly — the public hero updates on next visit, no rebuild.">
      <DesignSelect settingKey="home_hero_eyebrow_style" label="Eyebrow style" options={EYEBROW_STYLES} fallback="pill" hint="Pill = current badge. Minimal = gold text with lines. Tag = gold square + text." />
      <DesignSelect settingKey="home_hero_title_size" label="Title size" options={TITLE_SIZES} fallback="standard" hint="Standard = current 40px/68px. Grand = statement 44px/80px." />
      <div className="md:col-span-2">
        <DesignSelect settingKey="home_hero_align" label="Alignment" options={HERO_ALIGNS} fallback="left" hint="Home hero defaults left. Center stacks badge, heading, buttons and mini-stats centrally." />
      </div>
    </Card>
  )
}

export function GlobalHeroDesignCard() {
  return (
    <Card title="Inner page hero design (all pages)" desc="One choice styles every inner hero (About, Services, Industries, Products, Process, Why Us, Contact, Quote…). Titles keep their gold-highlight split.">
      <DesignSelect settingKey="page_hero_eyebrow_style" label="Eyebrow style" options={EYEBROW_STYLES} fallback="pill" />
      <DesignSelect settingKey="page_hero_title_size" label="Title size" options={TITLE_SIZES} fallback="standard" />
      <div className="md:col-span-2">
        <DesignSelect settingKey="page_hero_align" label="Alignment" options={HERO_ALIGNS} fallback="center" />
      </div>
    </Card>
  )
}

export function CtaDesignCard() {
  return (
    <Card title="CTA card design (Home + all inner pages)" desc="The gold-framed navy card from Home — 'Ready to Simplify Your Procurement?' — is the single CTA design everywhere. These options restyle all of them at once, including theme.">
      <DesignSelect settingKey="cta_eyebrow_style" label="Eyebrow style" options={EYEBROW_STYLES} fallback="pill" />
      <DesignSelect settingKey="cta_title_size" label="Title size" options={TITLE_SIZES} fallback="standard" />
      <DesignSelect settingKey="cta_align" label="Alignment" options={HERO_ALIGNS} fallback="center" />
      <DesignSelect settingKey="cta_theme" label="Card theme" options={CTA_THEMES} fallback="navy-gold" hint="Navy + Gold = signature. Emerald = green premium. Midnight = deep black-navy." />
    </Card>
  )
}

export function FooterHeadingDesignCard() {
  return (
    <Card title="Footer column headings" desc="QUICK LINKS, SERVICES and CONTACT share one heading design — the same gold family as the COT headings. Rename any column or switch style; the footer mirrors instantly.">
      <DesignSelect settingKey="footer_heading_style" label="Heading style" options={FOOTER_HEADING_STYLES} fallback="gold-bar" hint="Classic = plain white. Gold bar = white + gold underline. Gold highlight = last word in gold gradient + bar." />
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">Preview</span>
        <span className="block rounded-xl bg-navy-800 px-4 py-3 font-display text-sm font-bold uppercase tracking-[0.18em] text-white">
          Quick <span className="text-gradient-gold">Links</span>
          <span className="mt-2 block h-0.5 w-10 bg-gradient-to-r from-gold-400 to-transparent" aria-hidden />
        </span>
      </label>
    </Card>
  )
}
