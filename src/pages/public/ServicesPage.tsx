import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Car,
  Check,
  ClipboardCheck,
  Code2,
  FileText,
  Handshake,
  Layers,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Store,
  Tractor,
  Zap,
} from 'lucide-react'
import { IMAGES } from '@/lib/utils'
import { matchSlug } from '@/lib/design'
import { CATALOGUE, canonicalCatalogueSlug } from '@/lib/catalogue'
import { fetchPublicServices, setPageMeta, type PublicService, useSiteImage, useSiteSettings } from '@/lib/siteData'
import { PageHero, PremiumCTA, SectionHeading } from '@/components/ui'

const SERVICE_IMAGES: Record<string, string> = {
  'office-stationery':
    'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?q=80&w=1200&auto=format&fit=crop',
  'it-equipment':
    'https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=1200&auto=format&fit=crop',
  'cleaning-janitorial':
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop',
  'ppe-safety':
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1200&auto=format&fit=crop',
  'office-furniture':
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop',
  'printing-branding':
    'https://images.unsplash.com/photo-1562408590-e32931084e23?q=80&w=1200&auto=format&fit=crop',
  'electrical-materials':
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&auto=format&fit=crop',
  'automobile-services':
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200&auto=format&fit=crop',
  'it-solutions-digital-services':
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1200&auto=format&fit=crop',
  'agro-foodstuffs':
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=1200&auto=format&fit=crop',
  'custom-sourcing':
    'https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1200&auto=format&fit=crop',
}

const serviceMeta: Record<
  string,
  { icon: typeof FileText; tag: string; overview: string; bullets: string[] }
> = {
  'office-stationery': {
    icon: FileText,
    tag: 'Everyday Essentials',
    overview:
      'Your office runs on the small things — and running out of them costs productivity. We supply a complete range of office stationery and consumables on scheduled or on-demand delivery, consolidating dozens of suppliers into one reliable account. Every item is genuine, branded stock at wholesale-competitive pricing.',
    bullets: [
      'Writing instruments, markers and correction supplies',
      'Papers: copy, printer, fax, coloured and specialty',
      'Filing systems: lever-arch files, folders, suspension files',
      'Ink and toner for all major printer brands',
      'Desk accessories, diaries, planners and organisers',
      'Mailroom supplies: envelopes, packaging, stamps',
    ],
  },
  'it-equipment': {
    icon: Layers,
    tag: 'Technology',
    overview:
      'Technology purchases are long-term decisions — we make them safe ones. We specify, source and deliver business-grade IT equipment matched to your workload and budget, with manufacturer warranties and optional setup support. From a single laptop to a full office network rollout, you deal with one accountable partner.',
    bullets: [
      'Laptops and desktops from HP, Dell, Lenovo and Acer',
      'Monitors, docking stations and peripherals',
      'Printers, scanners and consumables supply contracts',
      'Networking: routers, switches, Wi-Fi access points',
      'Power protection: UPS units and surge suppressors',
      'Advice on specifications before you commit to purchase',
    ],
  },
  'cleaning-janitorial': {
    icon: Sparkles,
    tag: 'Facility Care',
    overview:
      'A clean environment protects health, reputation and asset value. We keep facilities supplied with professional janitorial products — from daily consumables to commercial cleaning machines — with standing-order options so critical items like soap and tissue never run out.',
    bullets: [
      'Bulk hand sanitisers, soaps and dispensing systems',
      'Disinfectants and multi-surface cleaning chemicals',
      'Mops, buckets, brooms and microfibre systems',
      'Tissue and hygiene paper products by the carton',
      'Waste management: bins, liners, colour-coded systems',
      'Commercial machines: vacuums, polishers, extractors',
    ],
  },
  'ppe-safety': {
    icon: ShieldCheck,
    tag: 'Safety First',
    overview:
      'Protecting your people is a legal and moral obligation — and we treat it that way. All our PPE meets recognised international standards, with certification documentation available on request. We supply construction sites, factories, hospitals, schools and labs across Ghana.',
    bullets: [
      'Head, eye, ear and respiratory protection',
      'Certified safety footwear and workwear',
      'Cut-resistant, chemical-rated and general gloves',
      'Fall-arrest harnesses and height-safety equipment',
      'First aid kits compliant with workplace regulations',
      'Site safety signage and high-visibility apparel',
    ],
  },
  'office-furniture': {
    icon: Store,
    tag: 'Workspaces',
    overview:
      'The right furniture changes how people work. We supply and install ergonomic, durable office furniture — from a single executive desk to complete floor fit-outs for hundreds of staff — including space planning advice, delivery and assembly anywhere in Ghana.',
    bullets: [
      'Executive desks, credenzas and boardroom tables',
      'Ergonomic task chairs and executive seating',
      'Modular workstation clusters and benching systems',
      'Steel storage: filing cabinets, tambour units, safes',
      'Reception furniture and visitor lounge seating',
      'Delivery, assembly and old-furniture removal',
    ],
  },
  'printing-branding': {
    icon: ClipboardCheck,
    tag: 'Brand Identity',
    overview:
      'Your brand deserves consistency across every touchpoint. Our printing and branding desk handles everything from everyday stationery to large-format outdoor campaigns — working to your brand guidelines with proofs approved before production.',
    bullets: [
      'Corporate stationery: cards, letterheads, envelopes',
      'Marketing collateral: brochures, flyers, catalogues',
      'Large format: banners, billboards, roll-up stands',
      'Apparel branding: embroidery and print',
      'Signage: 3D letters, lightboxes, directional signs',
      'Corporate gifts and event merchandise',
    ],
  },
  'electrical-materials': {
    icon: Zap,
    tag: 'Infrastructure',
    overview:
      'Electrical work leaves no room for substandard components. We supply certified cables, fittings, lighting and power equipment for contractors, facility managers and builders — with technical specifications provided upfront and bulk project pricing available.',
    bullets: [
      'Cables: single-core, armoured, flexible, solar',
      'Protection gear: breakers, distribution boards, surges',
      'LED lighting: bulbs, panels, floods, street lights',
      'Wiring accessories: sockets, switches, conduits',
      'Backup power: generators, UPS and inverter systems',
      'Solar solutions: panels, inverters, batteries',
    ],
  },
  'automobile-services': {
    icon: Car,
    tag: 'Mobility',
    overview:
      'Your fleet and vehicles are business-critical — we keep them running. We source brand-new and quality pre-owned vehicles, genuine spare parts and accessories, and coordinate scheduled servicing for single cars or full fleets. Every vehicle is inspected, documented and delivered road-ready with transparent pricing.',
    bullets: [
      'Brand-new and pre-owned vehicles, inspected and documented',
      'Genuine spare parts: brakes, suspension, engine, electrical',
      'Tyres, batteries, lubricants and fluids in bulk',
      'Accessories: trackers, dashcams, racks, detailing',
      'Scheduled servicing and fleet maintenance plans',
      'Registration, insurance and roadworthy support',
    ],
  },
  'it-solutions-digital-services': {
    icon: Code2,
    tag: 'Digital',
    overview:
      'Your online presence and back-office systems deserve the same single-partner treatment as everything else you procure. Corporate websites designed, built and maintained in-house. ERP and business systems specified and sourced with specialist partners. Hardware remains under IT Equipment. Every engagement starts with a scoping call, follows with a written proposal, and ends with training and a care or support plan, all with transparent pricing.',
    bullets: [
      'Business websites: design, development, maintenance',
      'E-commerce stores with MoMo and card payments',
      'ERP, CRM and business systems sourced and rolled out',
      'Domain, hosting and business email setup',
      'SEO, analytics and systems integration',
      'Training, handover and priority support plans',
    ],
  },
  'agro-foodstuffs': {
    icon: Tractor,
    tag: 'Farm to Door',
    overview:
      'Whether you are stocking a kitchen, a school, a hotel or an export container — we act as your intermediary between vetted farmers and your table. We source yam, maize, cocoa, rice, cassava, plantain, fresh vegetables, fruits, beans, oils and spices, verify quality at the farm gate and deliver anywhere in Ghana or worldwide with proper packing and documentation.',
    bullets: [
      'Staples: yam, maize, rice, cassava, gari and plantain',
      'Fresh vegetables and seasonal fruits, sorted and graded',
      'Cocoa, beans, grains, groundnuts and bulk oils',
      'Spices and seasonings: ginger, turmeric, dawadawa, prekese',
      'Bulk, institutional and export quantities',
      'Quality checks, packing and delivery in Ghana or abroad',
    ],
  },
  'custom-sourcing': {
    icon: Handshake,
    tag: 'Tailored For You',
    overview:
      'Not every need fits a category — and "no" is not in our vocabulary. Our custom sourcing service exists for exactly this: tell us the specification, quantity and deadline, and our procurement team taps its network of local and international suppliers until it is found, priced competitively and delivered.',
    bullets: [
      'Any product your business needs, sourced to spec',
      'Local and international supplier networks',
      'Consolidated shipping and customs handling',
      'One-off purchases or recurring supply programmes',
      'Full transparency: quotations show itemised pricing',
      'Typical sourcing turnaround: 3–10 working days',
    ],
  },
}

export default function ServicesPage() {
  const s = useSiteSettings()
  const [dbServices, setDbServices] = useState<PublicService[] | null>(null)
  const heroImg = useSiteImage('services_hero', IMAGES.hero2)
  const [searchParams] = useSearchParams()
  const highlight = searchParams.get('highlight') ?? searchParams.get('service') ?? ''
  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  useEffect(() => {
    setPageMeta('Services | GNAB Business Solutions', 'From everyday office essentials to fully custom sourcing — one partner, endless solutions.')
    void fetchPublicServices().then(setDbServices)
  }, [])

  const highlightSlug = highlight ? slugify(highlight) : ''
  const orderedDbServices = useMemo(() => {
    if (!dbServices || !highlightSlug) return dbServices
    const idx = dbServices.findIndex((s) => matchSlug(canonicalCatalogueSlug(s.name), highlightSlug) || matchSlug(s.name, highlightSlug) || matchSlug(s.category ?? '', highlightSlug))
    if (idx <= 0) return dbServices
    const copy = [...dbServices]
    const [hit] = copy.splice(idx, 1) as [typeof copy[number]]
    if (hit) copy.unshift(hit as any)
    return copy
  }, [dbServices, highlightSlug])

  const orderedCatalogue = useMemo(() => {
    if (!highlightSlug) return CATALOGUE
    const idx = CATALOGUE.findIndex((c) => matchSlug(c.slug, highlightSlug) || matchSlug(c.title, highlightSlug))
    if (idx <= 0) return CATALOGUE
    const copy = [...CATALOGUE]
    const [hit] = copy.splice(idx, 1) as [typeof copy[number]]
    if (hit) copy.unshift(hit as any)
    return copy
  }, [highlightSlug])

  /* When admins publish services they take over the page; otherwise the
     curated catalogue below keeps the site complete. */
  if (dbServices && dbServices.length > 0) {
    return (
      <div>
        <PageHero
          eyebrow="Our Services"
          title={<>{(s.services_hero_title || 'Procurement Solutions for Every Need').replace(s.services_hero_title_highlight || 'Every Need', '').trim()} <span className="text-gradient-gold">{s.services_hero_title_highlight || 'Every Need'}</span></>}
          subtitle={s.services_hero_subtitle || 'From everyday office essentials to fully custom sourcing — one partner, endless solutions.'}
          image={heroImg}
        />
        <section className="bg-mist py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow={s.services_section_eyebrow || "What We Offer"}
              title={s.services_section_title || "Explore Our Service Catalogues"}
              subtitle={s.services_section_subtitle || "Click any service to browse its full product catalogue."}
            />
            <div className="space-y-10">
              {(orderedDbServices ?? dbServices).map((sItem, i) => { const canonSlug = canonicalCatalogueSlug(sItem.category || sItem.name); const isHighlighted = !!highlightSlug && i === 0 && (matchSlug(canonSlug, highlightSlug) || matchSlug(sItem.name, highlightSlug) || matchSlug(sItem.category ?? '', highlightSlug)); return (
                <motion.article
                  key={sItem.id}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                >
                    <Link
                    to={`/products?category=${encodeURIComponent(canonSlug)}`}
                    className={`card-hover group relative grid overflow-hidden rounded-[32px] border bg-white shadow-soft lg:grid-cols-[1fr_1.25fr] ${isHighlighted ? 'border-gold-400 ring-2 ring-gold-400' : 'border-gray-100'} ${i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}
                  >
                    {isHighlighted && <span className="absolute left-6 top-6 z-10 rounded-full bg-gold-400 px-3 py-1 text-xs font-bold text-navy shadow">Selected</span>}
                    <div className="relative min-h-[280px] overflow-hidden bg-navy">
                      {sItem.image_url ? (
                        <img src={sItem.image_url} alt={sItem.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]" />
                      ) : (
                        <img src={SERVICE_IMAGES[canonSlug] ?? SERVICE_IMAGES['custom-sourcing']} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-60" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/25 to-transparent" aria-hidden />
                      {sItem.category && (
                        <span className="absolute left-6 top-6 rounded-full bg-navy-800/60 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                          {sItem.category}
                        </span>
                      )}
                    </div>
                    <div className="p-8 md:p-11">
                      <h2 className="font-display text-2xl font-bold text-navy transition-colors group-hover:text-navy-500">{sItem.name}</h2>
                      {sItem.short_description && <p className="mt-4 text-[15.5px] font-medium leading-relaxed text-navy-500">{sItem.short_description}</p>}
                      {sItem.full_description && <p className="mt-3 text-[15px] leading-relaxed text-ink-light">{sItem.full_description}</p>}
                      <div className="mt-7 flex flex-wrap items-center gap-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white transition-all duration-300 group-hover:bg-brand-green-500">
                          Browse Products <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green-600 transition-all duration-300 group-hover:gap-2.5">
                          or Request a Quote <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ) })}
            </div>
          </div>
        </section>

        <PremiumCTA
          eyebrow={s.services_cta_eyebrow || 'Custom sourcing'}
          title={s.services_cta_title || 'Need Something Specific?'}
            titleHighlight={s.services_cta_title_highlight}
            features={[s.services_cta_feature1, s.services_cta_feature2, s.services_cta_feature3]}
          subtitle={s.services_cta_subtitle || 'We handle custom procurement requests for unique business needs — just ask.'}
          primary={{ label: s.services_cta_primary_label || 'Request a Custom Quote', to: '/quote' }}
          secondary={{ label: s.services_cta_secondary_label || 'Explore Products', to: '/products' }}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHero
        eyebrow="Our Services"
        title={<>{(s.services_hero_title || 'Procurement Solutions for Every Need').replace(s.services_hero_title_highlight || 'Every Need', '').trim()} <span className="text-gradient-gold">{s.services_hero_title_highlight || 'Every Need'}</span></>}
        subtitle={s.services_hero_subtitle || 'From everyday office essentials to fully custom sourcing — one partner, endless solutions.'}
        image={heroImg}
      />

      {/* Detailed services */}
      <section className="bg-mist py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow={s.services_section_eyebrow || "What We Offer"}
            title={s.services_section_title || "Explore Our Service Catalogues"}
            subtitle={s.services_section_subtitle || "Click any service to browse its full product catalogue."}
          />

          <div className="space-y-10">
            {orderedCatalogue.map((cat, i) => {
              const meta = serviceMeta[cat.slug]!
              const Icon = meta?.icon ?? PackageCheck
              const isHighlighted = !!highlightSlug && i === 0 && (matchSlug(cat.slug, highlightSlug) || matchSlug(cat.title, highlightSlug))
              return (
                <motion.article
                  key={cat.slug}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={`/products?category=${cat.slug}`}
                    className={`card-hover group relative grid overflow-hidden rounded-[32px] border bg-white shadow-soft lg:grid-cols-[1fr_1.25fr] ${isHighlighted ? 'border-gold-400 ring-2 ring-gold-400' : 'border-gray-100'} ${i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}
                  >
                    {isHighlighted && <span className="absolute left-6 top-6 z-10 rounded-full bg-gold-400 px-3 py-1 text-xs font-bold text-navy shadow">Selected</span>}
                    {/* Visual side — real category imagery */}
                    <div className="relative min-h-[280px] overflow-hidden">
                      <img
                        src={SERVICE_IMAGES[cat.slug]}
                        alt={cat.title}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/25 to-transparent" aria-hidden />
                      <span className="absolute left-6 top-6 rounded-full bg-navy-800/60 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                        {meta?.tag}
                      </span>
                      <span className="absolute bottom-6 left-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/40 backdrop-blur-md transition-all duration-500 group-hover:bg-gold-400 group-hover:text-navy">
                        <Icon size={22} strokeWidth={1.7} />
                      </span>
                    </div>

                    {/* Content side */}
                    <div className="p-8 md:p-11">
                      <h2 className="font-display text-2xl font-bold text-navy transition-colors group-hover:text-navy-500">
                        {cat.title}
                      </h2>
                      <p className="mt-4 text-[15.5px] leading-relaxed text-ink-light">{meta!.overview}</p>

                      <ul className="mt-6 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                        {meta.bullets.slice(0, 4).map((b) => (
                          <li key={b} className="flex items-start gap-2.5 text-[14px] text-ink">
                            <Check size={16} className="mt-0.5 flex-shrink-0 text-brand-green-500" strokeWidth={3} />
                            {b}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-7 flex flex-wrap items-center gap-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white transition-all duration-300 group-hover:bg-brand-green-500">
                          View {cat.products.length}-Product Catalogue <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green-600 transition-all duration-300 group-hover:gap-2.5">
                          or Request a Quote <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              )
            })}
          </div>
        </div>
      </section>

      <PremiumCTA
        eyebrow={s.services_cta_eyebrow || 'Custom sourcing'}
        title={s.services_cta_title || 'Need Something Specific?'}
            titleHighlight={s.services_cta_title_highlight}
            features={[s.services_cta_feature1, s.services_cta_feature2, s.services_cta_feature3]}
        subtitle={s.services_cta_subtitle || 'We handle custom procurement requests for unique business needs — just ask.'}
        primary={{ label: s.services_cta_primary_label || 'Request a Custom Quote', to: '/quote' }}
        secondary={{ label: s.services_cta_secondary_label || 'Explore Products', to: '/products' }}
      />
    </div>
  )
}
