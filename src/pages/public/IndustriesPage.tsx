import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Building2,
  Globe2,
  GraduationCap,
  Handshake,
  HardHat,
  HeartPulse,
  Hotel,
  Store,
} from 'lucide-react'
import { IMAGES } from '@/lib/utils'
import {
  PageHero,
  PremiumCTA,
  staggerChild,
  staggerParent,
} from '@/components/ui'
import { fetchPublicIndustries, setPageMeta, useSiteImage, useSiteSettings } from '@/lib/siteData'
import { ICON_MAP } from '@/lib/iconOptions'

const FALLBACK: { icon: typeof Building2; name: string; desc: string; image_url: string | null }[] = [
  { icon: Building2, name: 'Corporate Organisations', desc: 'End-to-end procurement support for enterprises — from daily consumables to full office setups, handled with corporate-grade reliability.', image_url: null },
  { icon: Globe2, name: 'Government & Public Sector', desc: 'Transparent, compliant procurement for ministries, agencies and public institutions, with documentation you can trust.', image_url: null },
  { icon: GraduationCap, name: 'Schools & Universities', desc: 'Stationery, lab supplies, furniture and IT equipment that keep institutions running — on budget, on schedule.', image_url: null },
  { icon: HeartPulse, name: 'Hospitals & Healthcare', desc: 'Reliable supply of medical consumables, hygiene products and operational equipment for healthcare facilities.', image_url: null },
  { icon: Hotel, name: 'Hotels & Hospitality', desc: 'Guest amenities, kitchen supplies, cleaning solutions and branding materials for premium hospitality experiences.', image_url: null },
  { icon: HardHat, name: 'Construction Companies', desc: 'PPE, electrical materials, tools and site supplies delivered where and when your project needs them.', image_url: null },
  { icon: Handshake, name: 'NGOs & Development', desc: 'Cost-effective, accountable procurement for non-profit programmes and development projects across Ghana.', image_url: null },
  { icon: Store, name: 'SMEs', desc: 'Big-business sourcing power for small and medium enterprises — flexible quantities, fair prices, no hassle.', image_url: null },
]

// ICON_MAP imported from @/lib/iconOptions — supports all 40+ icons

export default function IndustriesPage() {
  const s = useSiteSettings()
  const heroImg = useSiteImage('industries_hero', IMAGES.hero3)
  const [live, setLive] = useState<typeof FALLBACK | null>(null)
  const [searchParams] = useSearchParams()
  const highlight = searchParams.get('highlight') ?? searchParams.get('industry') ?? ''
  const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  useEffect(() => {
    setPageMeta('Industries | GNAB Business Solutions', 'From government ministries to growing startups — we understand the unique procurement needs of each industry.')
    void fetchPublicIndustries().then((rows) => {
      if (rows.length > 0) setLive(rows.map((r) => ({ icon: (ICON_MAP[r.icon ?? ''] ?? Building2) as typeof Building2, name: r.name, desc: r.description ?? '', image_url: r.image_url ?? null })))
    })
  }, [])
  const highlightSlug = highlight ? slugify(highlight) : ''
  const display = useMemo(() => {
    const base = live ?? FALLBACK
    if (!highlightSlug) return base
    const idx = base.findIndex((r) => {
      const slug = slugify(r.name)
      return slug === highlightSlug || slug.includes(highlightSlug) || highlightSlug.includes(slug)
    })
    if (idx <= 0) return base
    const copy = [...base]
    const [hit] = copy.splice(idx, 1)
    if (hit) copy.unshift(hit)
    return copy
  }, [live, highlightSlug])
  return (
    <div>
      <PageHero
        eyebrow="Industries We Serve"
        title={<>{(s.industries_hero_title || 'Trusted Across Every Sector').replace(s.industries_hero_title_highlight || 'Every Sector', '').trim()} <span className="text-gradient-gold">{s.industries_hero_title_highlight || 'Every Sector'}</span></>}
        subtitle={s.industries_hero_subtitle || 'From government ministries to growing startups — we understand the unique procurement needs of each industry.'}
        image={heroImg}
      />

      <section className="bg-mist py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid gap-7 md:grid-cols-2 lg:grid-cols-4"
          >
            {display.map((ind, i) => {
              const isHighlighted = !!highlightSlug && i === 0 && (() => {
                const slug = slugify(ind.name)
                return slug === highlightSlug || slug.includes(highlightSlug) || highlightSlug.includes(slug)
              })()
              return (
              <motion.div key={ind.name} variants={staggerChild}>
                <div className={`card-hover group relative flex h-full flex-col overflow-hidden rounded-[28px] border bg-white shadow-soft ${isHighlighted ? 'border-gold-400 ring-2 ring-gold-400' : 'border-gray-100'}`}>
                  {isHighlighted && <span className="absolute left-6 top-6 z-10 rounded-full bg-gold-400 px-3 py-1 text-xs font-bold text-navy shadow">Selected</span>}
                  {ind.image_url ? (
                    <div className="relative h-48 overflow-hidden">
                      <img src={ind.image_url} alt={ind.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />
                      <span className="absolute bottom-4 left-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 text-navy shadow-lg backdrop-blur">
                        <ind.icon size={22} strokeWidth={1.7} />
                      </span>
                    </div>
                  ) : (
                    <div className="p-8 pb-0">
                      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 text-navy transition-all duration-300 group-hover:bg-navy group-hover:text-gold-400">
                        <ind.icon size={26} strokeWidth={1.7} />
                      </span>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-8 pt-6">
                    <h3 className="font-display text-lg font-bold leading-snug text-navy">{ind.name}</h3>
                    <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-ink-light">{ind.desc}</p>
                    <Link
                      to="/products"
                      className="mt-6 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-green-600 transition-all duration-300 group-hover:gap-2.5"
                    >
                      Explore <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      <PremiumCTA
        eyebrow={s.industries_cta_eyebrow || 'Your industry'}
        title={s.industries_cta_title || "Don't See Your Sector?"}
            titleHighlight={s.industries_cta_title_highlight}
            features={[s.industries_cta_feature1, s.industries_cta_feature2, s.industries_cta_feature3]}
        subtitle={s.industries_cta_subtitle || 'We serve organisations of every type and size across Ghana. Tell us what you need.'}
        primary={{ label: s.industries_cta_primary_label || 'Request a Quote', to: '/quote' }}
        secondary={{ label: s.industries_cta_secondary_label || 'Contact Our Team', to: '/contact' }}
      />
    </div>
  )
}
