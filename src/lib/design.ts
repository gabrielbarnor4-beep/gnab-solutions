/* ------------------------------------------------------------------ */
/* Heading / CTA / footer design system — premium options, admin-driven */
/* Every public heading reads these via site_settings (see 029 migration) */
/* ------------------------------------------------------------------ */

export const EYEBROW_STYLES = ['pill', 'minimal', 'tag'] as const
export type EyebrowStyle = (typeof EYEBROW_STYLES)[number]

export const TITLE_SIZES = ['compact', 'standard', 'grand'] as const
export type TitleSize = (typeof TITLE_SIZES)[number]

export const CTA_THEMES = ['navy-gold', 'emerald', 'midnight'] as const
export type CtaTheme = (typeof CTA_THEMES)[number]

export const FOOTER_HEADING_STYLES = ['classic', 'gold-bar', 'gold-highlight'] as const
export type FooterHeadingStyle = (typeof FOOTER_HEADING_STYLES)[number]

export const HERO_ALIGNS = ['left', 'center'] as const
export type HeroAlign = (typeof HERO_ALIGNS)[number]

export function slugify(v: string): string {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** Fuzzy slug match — exact, substring, or token overlap either way.
 *  Used everywhere a card links to a filtered page (Services/Industries
 *  highlight, service → products category), so "ppe-safety-equipment"
 *  still matches the "ppe-safety" group — and "custom-procurement-sourcing"
 *  still matches "custom-sourcing" — instead of showing nothing. */
export function matchSlug(a: string, b: string): boolean {
  const sa = slugify(a)
  const sb = slugify(b)
  if (!sa || !sb) return false
  if (sa === sb || sa.includes(sb) || sb.includes(sa)) return true
  const ta = sa.split('-').filter(Boolean)
  const tb = sb.split('-').filter(Boolean)
  if (ta.length === 0 || tb.length === 0) return false
  const [shorter, longer] = ta.length <= tb.length ? [ta, tb] : [tb, ta]
  return shorter.every((tok) => longer.includes(tok))
}

/** Split "Ready to Simplify Your Procurement?" + highlight "Your Procurement?" into prefix/gold parts.
 *  If highlight is empty or not found, returns the full title as prefix with no gold part. */
export function splitHighlight(title: string, highlight: string): { prefix: string; gold: string } {
  const t = (title || '').trim()
  const h = (highlight || '').trim()
  if (!t) return { prefix: '', gold: '' }
  if (!h) return { prefix: t, gold: '' }
  const idx = t.toLowerCase().lastIndexOf(h.toLowerCase())
  if (idx < 0) return { prefix: t, gold: '' }
  return { prefix: t.slice(0, idx).trim(), gold: t.slice(idx, idx + h.length).trim() || h }
}

/** Title size classes — shared by PageHero, PremiumCTA and Home hero/COT. */
export function titleSizeClass(size: string, kind: 'hero' | 'cta' | 'home-hero'): string {
  if (kind === 'home-hero') {
    if (size === 'compact') return 'font-display text-4xl font-extrabold leading-[1.08] text-white sm:text-5xl lg:text-6xl'
    if (size === 'grand') return 'font-display text-[44px] font-extrabold leading-[1.05] text-white sm:text-7xl lg:text-[80px]'
    return 'font-display text-[40px] font-extrabold leading-[1.08] text-white sm:text-6xl lg:text-[68px]'
  }
  if (size === 'compact') return 'mx-auto max-w-2xl font-display text-2xl font-extrabold leading-tight text-white md:text-4xl'
  if (size === 'grand') return 'mx-auto max-w-3xl font-display text-4xl font-extrabold leading-[1.05] text-white md:text-6xl'
  return 'mx-auto max-w-2xl font-display text-3xl font-extrabold leading-tight text-white md:text-5xl'
}

/** CTA theme classes — outer gold frame + inner navy gradient + orb tints. */
export function ctaThemeClass(theme: string): { outer: string; inner: string; orbA: string; orbB: string } {
  if (theme === 'emerald') {
    return {
      outer: 'bg-gradient-to-br from-emerald-200 via-emerald-400 to-teal-500',
      inner: 'bg-gradient-to-br from-[#06281f] via-[#0a3d2e] to-[#051a14]',
      orbA: 'bg-emerald-400/15',
      orbB: 'bg-gold-400/10',
    }
  }
  if (theme === 'midnight') {
    return {
      outer: 'bg-gradient-to-br from-slate-300 via-gold-400 to-amber-600',
      inner: 'bg-gradient-to-br from-[#030712] via-[#0B2E59] to-[#020617]',
      orbA: 'bg-white/10',
      orbB: 'bg-gold-400/10',
    }
  }
  return {
    outer: 'bg-gradient-to-br from-gold-200 via-gold-400 to-amber-500',
    inner: 'bg-gradient-to-br from-navy via-navy-800 to-navy-900',
    orbA: 'bg-gold-400/10',
    orbB: 'bg-brand-green-500/10',
  }
}

export const DESIGN_LABELS: Record<string, string> = {
  pill: 'Pill — gold badge (default)',
  minimal: 'Minimal — gold text with side lines',
  tag: 'Tag — solid gold square + white text',
  compact: 'Compact — smaller, denser',
  standard: 'Standard — balanced (default)',
  grand: 'Grand — large, statement',
  'navy-gold': 'Navy + Gold — signature (default)',
  emerald: 'Emerald — green premium',
  midnight: 'Midnight — deep black-navy',
  classic: 'Classic — white uppercase (default)',
  'gold-bar': 'Gold bar — white + gold underline',
  'gold-highlight': 'Gold highlight — last word in gold gradient + bar',
  left: 'Left aligned',
  center: 'Center aligned',
}
