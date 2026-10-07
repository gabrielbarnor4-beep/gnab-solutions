import { useEffect, useRef, useState } from 'react'
import { fetchApprovedTestimonials } from '@/lib/testimonials'
import { Link } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Car,
  ClipboardCheck,
  Clock,
  Code2,
  FileText,
  Globe2,
  GraduationCap,
  Handshake,
  HardHat,
  Headphones,
  HeartPulse,
  Hotel,
  Layers,
  PackageCheck,
  Quote as QuoteIcon,
  ShieldCheck,
  Sparkles,
  Store,
  Tractor,
  Truck,
  Wallet,
} from 'lucide-react'
import { IMAGES, imgSrcSet } from '@/lib/utils'
import { ctaThemeClass, titleSizeClass } from '@/lib/design'
import {
  ButtonLink,
  Eyebrow,
  Reveal,
  SectionHeading,
  staggerChild,
  staggerParent,
} from '@/components/ui'
import {
  fetchHomeAbout,
  fetchHomeCta,
  fetchHomeHero,
  fetchHomeStats,
  fetchHomeTrust,
  fetchPublicIndustries,
  setOrganizationJsonLd,
  setPageMeta,
  fetchPublicProcessSteps,
  fetchPublicServices,
  fetchPublicWhy,
  fetchSiteImages,
  useSiteSettings,
} from '@/lib/siteData'
import { ICON_MAP } from '@/lib/iconOptions'
import { canonicalCatalogueSlug } from '@/lib/catalogue'

const HERO_IMAGES = [IMAGES.hero1, IMAGES.hero2, IMAGES.hero3]

const trustItems = [
  { icon: ShieldCheck, label: 'Reliable Procurement' },
  { icon: Wallet, label: 'Competitive Pricing' },
  { icon: PackageCheck, label: 'Quality Assurance' },
  { icon: Truck, label: 'Timely Delivery' },
  { icon: Handshake, label: 'Trusted Supplier Network' },
]

const services = [
  { icon: FileText, title: 'Office Stationery', slug: 'office-stationery', desc: 'Full range of office supplies and consumables to keep your business running.' },
  { icon: Layers, title: 'IT Equipment', slug: 'it-equipment', desc: 'Computers, printers, networking gear and every accessory in between.' },
  { icon: Sparkles, title: 'Cleaning Supplies', slug: 'cleaning-janitorial', desc: 'Professional janitorial products and hygiene solutions.' },
  { icon: ShieldCheck, title: 'PPE & Safety', slug: 'ppe-safety', desc: 'Certified protective equipment for every industry standard.' },
  { icon: Store, title: 'Office Furniture', slug: 'office-furniture', desc: 'Ergonomic desks, chairs and complete workspace setups.' },
  { icon: ClipboardCheck, title: 'Printing & Branding', slug: 'printing-branding', desc: 'Custom printing and corporate branding that gets you noticed.' },
  { icon: Car, title: 'Automobile Services', slug: 'automobile-services', desc: 'Vehicles, genuine parts, accessories and servicing for fleets and individuals.' },
  { icon: Code2, title: 'IT Solutions', slug: 'it-solutions-digital-services', desc: 'Websites we design, build and maintain — plus ERP and business systems.' },
  { icon: Tractor, title: 'Agro & Foodstuffs', slug: 'agro-foodstuffs', desc: 'Yam, maize, cocoa, fruits and vegetables — sourced and delivered worldwide.' },
  { icon: Handshake, title: 'Custom Procurement', slug: 'custom-sourcing', desc: 'Tailored sourcing for requirements beyond the catalogue.' },
]

const industries = [
  { icon: Building2, name: 'Corporate', slug: 'corporate-organisations' },
  { icon: Globe2, name: 'Government', slug: 'government-public-sector' },
  { icon: GraduationCap, name: 'Education', slug: 'schools-universities' },
  { icon: HeartPulse, name: 'Healthcare', slug: 'hospitals-healthcare' },
  { icon: Hotel, name: 'Hospitality', slug: 'hotels-hospitality' },
  { icon: HardHat, name: 'Construction', slug: 'construction-companies' },
  { icon: Handshake, name: 'NGOs', slug: 'ngos-development' },
  { icon: Store, name: 'SMEs', slug: 'smes' },
]

const FALLBACK_WHY = [
  { icon: Handshake, title: 'Reliable Supplier Network', desc: '100+ vetted suppliers across Ghana and beyond — we never leave you waiting.' },
  { icon: Truck, title: 'Fast Delivery', desc: 'Optimised logistics that get products to your doorstep on schedule, every time.' },
  { icon: Wallet, title: 'Competitive Pricing', desc: 'Bulk purchasing power passed directly to you, without compromising quality.' },
  { icon: Headphones, title: 'Professional Support', desc: 'A dedicated account manager who understands your business inside-out.' },
  { icon: ShieldCheck, title: 'Quality Assurance', desc: 'Suppliers verified, goods inspected — nothing reaches you unchecked.' },
  { icon: Sparkles, title: 'Tailored Solutions', desc: 'Procurement packages shaped around your operations and budget.' },
]

const whyUs = FALLBACK_WHY

const FALLBACK_STEPS = [
  { num: '01', icon: FileText, title: 'Receive Request', desc: 'We capture and analyse your exact procurement needs.' },
  { num: '02', icon: PackageCheck, title: 'Source Products', desc: 'Our team negotiates with vetted suppliers for the best fit.' },
  { num: '03', icon: ClipboardCheck, title: 'Prepare Quotation', desc: 'A transparent quotation with clear pricing and timelines.' },
  { num: '04', icon: BadgeCheck, title: 'Client Approval', desc: 'You approve; we fine-tune until it is exactly right.' },
  { num: '05', icon: Truck, title: 'Delivery', desc: 'Tracked delivery straight to your specified location.' },
  { num: '06', icon: Headphones, title: 'After-Sales Support', desc: 'Ongoing support long after the invoice is settled.' },
]

const steps = FALLBACK_STEPS

const stats = [
  { value: 100, suffix: '+', label: 'Supplier Network' },
  { value: 500, suffix: '+', label: 'Products Available' },
  { value: 24, suffix: 'h', label: 'Quotation Response' },
  { value: 100, suffix: '%', label: 'Customer Commitment' },
]

const FALLBACK_TESTIMONIALS = [
  {
    id: 'fb-1',
    quote:
      'GNAB transformed how we handle procurement. One call, one quote, everything delivered ahead of schedule. They are an extension of our team.',
    client_name: 'Procurement Director',
    company: 'Leading Financial Institution, Accra',
    rating: 5,
  },
  {
    id: 'fb-2',
    quote:
      'Their response time is unmatched. Quotation within hours, delivery within days — even for bulk orders across multiple regions.',
    client_name: 'Operations Manager',
    company: 'Regional Hospital Network',
    rating: 5,
  },
  {
    id: 'fb-3',
    quote:
      'From stationery to full IT setups, GNAB handles it all with professionalism. Their pricing saved us over 20% last year.',
    client_name: 'Administrative Lead',
    company: 'International NGO, Ghana',
    rating: 5,
  },
]

const HERO_ICON_FALLBACK = Sparkles

/* Animated counter */
function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setDisplay(value)
      return
    }
    const duration = 1600
    const start = performance.now()
    let raf: number
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(eased * value))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, reduce])

  return (
    <span ref={ref}>
      {display}
      <span className="text-gold-400">{suffix}</span>
    </span>
  )
}

export default function HomePage() {
  const [heroIndex, setHeroIndex] = useState(0)
  const [testimonial, setTestimonial] = useState(0)
  const [reviews, setReviews] = useState(FALLBACK_TESTIMONIALS)
  const [liveIndustries, setLiveIndustries] = useState<typeof industries | null>(null)
  const [liveWhy, setLiveWhy] = useState<typeof FALLBACK_WHY | null>(null)
  const [liveSteps, setLiveSteps] = useState<typeof FALLBACK_STEPS | null>(null)
  const [heroImages, setHeroImages] = useState<string[] | null>(null)
  const [aboutImg, setAboutImg] = useState<string | null>(null)
  const [aboutOverlay, setAboutOverlay] = useState<string | null>(null)
  const [ctaBg, setCtaBg] = useState<string | null>(null)
  const [heroData, setHeroData] = useState<null | { badge: string; title_prefix: string; title_highlight: string; title_suffix: string; subtitle: string; primary_label: string; primary_link: string; secondary_label: string; secondary_link: string }>(null)
  const [trustLive, setTrustLive] = useState<{ icon: typeof HERO_ICON_FALLBACK; label: string }[] | null>(null)
  const [aboutData, setAboutData] = useState<null | { eyebrow: string; title_prefix: string; title_highlight: string; paragraph1: string; paragraph2: string; badge_value: string; badge_label: string; phone: string; phone_label: string; primary_label: string; primary_link: string; image_url: string | null; overlay_url: string | null }>(null)
  const [statsLive, setStatsLive] = useState<{ value: number; suffix: string; label: string }[] | null>(null)
  const [ctaData, setCtaData] = useState<null | { eyebrow: string; title_prefix: string; title_highlight: string; subtitle: string; primary_label: string; primary_link: string; secondary_label: string; secondary_link: string; feature1: string; feature2: string; feature3: string; bg_image_url: string | null }>(null)
  const [servicesLive, setServicesLive] = useState<typeof services | null>(null)
  const settings = useSiteSettings()
  const heroEyebrowStyle = settings.home_hero_eyebrow_style || 'pill'
  const heroTitleSize = settings.home_hero_title_size || 'standard'
  const heroAlign = settings.home_hero_align || 'left'
  const heroCentered = heroAlign !== 'left'
  const ctaTheme = ctaThemeClass(settings.cta_theme || 'navy-gold')
  const ctaTitleSize = settings.cta_title_size || 'standard'
  const ctaCentered = (settings.cta_align || 'center') !== 'left'
  const reduce = useReducedMotion()
  const displayHero = heroImages ?? HERO_IMAGES

  useEffect(() => {
    void fetchApprovedTestimonials().then((list) => {
      if (list.length > 0) {
        setReviews(
          list.map((t) => ({
            id: t.id,
            quote: t.quote,
            client_name: t.client_name,
            company: [t.client_role, t.company].filter(Boolean).join(', ') || '',
            rating: t.rating,
          }))
        )
      }
    })
    void fetchPublicIndustries().then((rows) => {
      if (rows.length > 0) {
        setLiveIndustries(rows.map((r) => ({ icon: (ICON_MAP[r.icon ?? ''] ?? Building2), name: r.name, slug: r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') })))
      }
    })
    void fetchPublicWhy().then((rows) => {
      if (rows.length > 0) {
        setLiveWhy(rows.map((r) => ({ icon: (ICON_MAP[r.icon ?? ''] ?? Handshake), title: r.title, desc: r.description ?? '' })))
      }
    })
    void fetchPublicProcessSteps().then((rows) => {
      if (rows.length > 0) {
        setLiveSteps(rows.map((r) => ({ num: r.step_number, icon: FileText, title: r.title, desc: r.description ?? '' })))
      }
    })
    void fetchPublicServices().then((rows) => {
      if (rows.length > 0) {
        const iconByName: Record<string, typeof FileText> = { 'Office Stationery & Consumables': FileText, 'IT Equipment & Accessories': Layers, 'Cleaning & Janitorial Supplies': Sparkles, 'PPE & Safety': ShieldCheck, 'PPE & Safety Equipment': ShieldCheck, 'Office Furniture': Store, 'Printing & Branding': ClipboardCheck, 'Electrical Materials': Layers, 'Automobile Services & Spares': Car, 'Automobile Services': Car, 'IT Solutions & Digital Services': Code2, 'IT Solutions': Code2, 'Agro & Foodstuffs': Tractor, 'Agro': Tractor, 'Custom Procurement & Sourcing': Handshake, 'Custom Sourcing': Handshake }
        // Show every published service (no slice) so Automobile is never cut off;
        // slug via canonical helper so Services highlight + Products filter always match.
        setServicesLive(rows.map((r) => ({ icon: iconByName[r.name] ?? iconByName[r.category ?? ''] ?? FileText, title: r.name, slug: canonicalCatalogueSlug(r.name), desc: r.short_description ?? '' })))
      }
    })
    setPageMeta('GNAB Business Solutions | One Partner. Endless Solutions.', 'Ghana\'s trusted partner for corporate procurement, sourcing and supply — reliable sourcing, competitive pricing, timely delivery.')
    setOrganizationJsonLd()
    void fetchHomeHero().then((h) => { if (h) setHeroData(h) })
    void fetchHomeTrust().then((rows) => { if (rows.length > 0) setTrustLive(rows.map((r) => ({ icon: (ICON_MAP[r.icon] ?? ShieldCheck), label: r.label }))) })
    void fetchHomeAbout().then((a) => { if (a) setAboutData(a) })
    void fetchHomeStats().then((rows) => { if (rows.length > 0) setStatsLive(rows.map((r) => ({ value: r.value, suffix: r.suffix, label: r.label }))) })
    void fetchHomeCta().then((c) => { if (c) setCtaData(c) })
    void fetchSiteImages('home_hero').then((rows) => { if (rows.length > 0) setHeroImages(rows.map((r) => r.url)) })
    void fetchSiteImages('home_about').then((rows) => { if (rows.length > 0) setAboutImg(rows[0]!.url) })
    void fetchSiteImages('home_about_overlay').then((rows) => { if (rows.length > 0) setAboutOverlay(rows[0]!.url) })
    void fetchSiteImages('home_cta').then((rows) => { if (rows.length > 0) setCtaBg(rows[0]!.url) })
  }, [])

  /* Hero crossfade rotation */
  useEffect(() => {
    if (reduce || displayHero.length < 2) return
    const id = setInterval(() => setHeroIndex((i) => (i + 1) % displayHero.length), 5000)
    return () => clearInterval(id)
  }, [reduce, reviews.length, displayHero.length])

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => setTestimonial((i) => (i + 1) % reviews.length), 6000)
    return () => clearInterval(id)
  }, [reduce, reviews.length])

  return (
    <div>
      {/* ================= HERO ================= */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-navy">
        {/* Rotating imagery */}
        <div className="absolute inset-0">
          <AnimatePresence mode="sync">
            <motion.div
              key={heroIndex}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: 'easeInOut' }}
            >
              <img
                src={displayHero[heroIndex % displayHero.length]!}
                srcSet={imgSrcSet(displayHero[heroIndex % displayHero.length]!)}
                sizes="100vw"
                alt=""
                className="h-full w-full object-cover"
                loading={heroIndex === 0 ? 'eager' : 'lazy'}
                {...(heroIndex === 0 ? { fetchPriority: 'high' as const } : {})}
                decoding="async"
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-transparent to-navy/30" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <motion.div
            initial={reduce ? undefined : { opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className={heroCentered ? 'mx-auto w-full max-w-3xl text-center' : 'max-w-3xl'}
          >
            {heroEyebrowStyle === 'minimal' ? (
              <p className={`mb-6 inline-flex items-center gap-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-gold-400 ${heroCentered ? 'mx-auto' : ''}`}>
                <span className="h-px w-8 bg-current opacity-60" aria-hidden />
                {heroData?.badge ?? 'Welcome to GNAB Business Solutions'}
                <span className="h-px w-8 bg-current opacity-60" aria-hidden />
              </p>
            ) : heroEyebrowStyle === 'tag' ? (
              <p className={`mb-6 inline-flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.18em] text-white ${heroCentered ? 'mx-auto' : ''}`}>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gold-400 text-navy" aria-hidden>
                  <Sparkles size={14} />
                </span>
                {heroData?.badge ?? 'Welcome to GNAB Business Solutions'}
              </p>
            ) : (
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[13px] font-semibold uppercase tracking-[0.18em] text-gold-400 backdrop-blur-sm">
                <Sparkles size={14} /> {heroData?.badge ?? 'Welcome to GNAB Business Solutions'}
              </p>
            )}
            <h1 className={titleSizeClass(heroTitleSize, 'home-hero')}>
              {heroData?.title_prefix ?? 'Your Trusted'}{' '}
              <span className="text-gradient-gold">{heroData?.title_highlight ?? 'Procurement & Supply'}</span>{' '}
              {heroData?.title_suffix ?? 'Partner'}
            </h1>
            <p className={`mt-7 max-w-xl text-lg leading-relaxed text-navy-100/85 md:text-xl ${heroCentered ? 'mx-auto text-center' : ''}`}>
              {heroData?.subtitle ?? 'We simplify procurement through reliable sourcing, competitive pricing and timely delivery — across Ghana and beyond.'}
            </p>
            <div className={`mt-10 flex flex-col gap-4 sm:flex-row ${heroCentered ? 'items-center justify-center' : ''}`}>
              <ButtonLink to={heroData?.primary_link ?? '/quote'} size="lg">
                {heroData?.primary_label ?? 'Request a Quote'} <ArrowRight size={18} />
              </ButtonLink>
              <ButtonLink to={heroData?.secondary_link ?? '/services'} variant="outlineLight" size="lg">
                {heroData?.secondary_label ?? 'Explore Our Services'}
              </ButtonLink>
            </div>

            {/* mini stats */}
            <div className="mt-14 grid max-w-lg grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
              {[
                ['100+', 'Suppliers'],
                ['500+', 'Products'],
                ['24h', 'Response'],
              ].map(([v, l]) => (
                <div key={l} className="px-4 py-4 text-center">
                  <p className="font-display text-xl font-bold text-white md:text-2xl">{v}</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-navy-100/70">{l}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* hero dots */}
        <div className="absolute bottom-8 right-8 hidden items-center gap-2 md:flex">
          {displayHero.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIndex(i)}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === heroIndex}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === heroIndex ? 'w-8 bg-gold-400' : 'w-3 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* ================= TRUST BAR ================= */}
      <section className="relative z-10 -mt-0 border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <ul className="grid grid-cols-2 gap-y-6 py-8 md:grid-cols-5">
              {(trustLive ?? trustItems).map((t) => (
                <li key={t.label} className="flex items-center justify-center gap-2.5 px-2">
                  <t.icon size={19} className="flex-shrink-0 text-brand-green-500" />
                  <span className="text-[13px] font-semibold uppercase tracking-wide text-navy">{t.label}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ================= ABOUT PREVIEW ================= */}
      <section className="overflow-hidden py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            {/* image composition */}
            <Reveal className="relative">
              <div className="relative overflow-hidden rounded-[28px] shadow-lift">
                <img src={aboutData?.image_url ?? aboutImg ?? IMAGES.about} alt="GNAB team at work" className="aspect-[4/3] w-full object-cover" loading="lazy" decoding="async" srcSet={imgSrcSet(aboutData?.image_url ?? aboutImg ?? IMAGES.about)} sizes="(max-width: 1024px) 100vw, 50vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/40 to-transparent" />
              </div>
              <div className="absolute -bottom-8 -right-2 hidden overflow-hidden rounded-3xl border-8 border-white shadow-lift md:block lg:-right-8">
                <img src={aboutData?.overlay_url ?? aboutOverlay ?? IMAGES.warehouse} alt="Warehouse logistics" className="h-44 w-56 object-cover" loading="lazy" decoding="async" srcSet={imgSrcSet(aboutData?.overlay_url ?? aboutOverlay ?? IMAGES.warehouse)} sizes="224px" />
              </div>
              <div className="absolute -top-5 left-6 rounded-2xl bg-navy px-6 py-4 shadow-lift">
                <p className="font-display text-2xl font-bold text-gold-400">{aboutData?.badge_value ?? '10+'}</p>
                <p className="text-xs font-medium uppercase tracking-wide text-navy-100">{aboutData?.badge_label ?? 'Years of Excellence'}</p>
              </div>
            </Reveal>

            <div>
              <SectionHeading
                align="left"
                eyebrow={aboutData?.eyebrow ?? 'About Us'}
                title={
                  <>
                    {aboutData?.title_prefix ?? 'Who We'} <span className="text-gradient-gold">{aboutData?.title_highlight ?? 'Are'}</span>
                  </>
                }
              />
              <Reveal delay={0.1}>
                <p className="-mt-6 text-[17px] leading-relaxed text-ink-light">
                  {aboutData?.paragraph1 ?? 'GNAB Business Solutions is a trusted procurement and supply partner providing organizations with a single point of contact for sourcing, purchasing and delivering quality products across multiple industries.'}
                </p>
                <p className="mt-5 text-[17px] leading-relaxed text-ink-light">
                  {aboutData?.paragraph2 ?? 'From office stationery to industrial equipment, we handle it all with professionalism and efficiency — so your business never stops running.'}
                </p>
                <div className="mt-9 flex flex-wrap items-center gap-6">
                  <ButtonLink to={aboutData?.primary_link ?? '/about'} variant="outlineNavy">
                    {aboutData?.primary_label ?? 'Learn More About Us'}
                  </ButtonLink>
                  <a href={`tel:${(aboutData?.phone ?? '+233554273445').replace(/\s/g, '')}`} className="group inline-flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-brand-green-500 ring-1 ring-green-200">
                      <Headphones size={18} />
                    </span>
                    <span className="text-sm">
                      <span className="block text-ink-light">{aboutData?.phone_label ?? 'Speak to our team'}</span>
                      <span className="font-semibold text-navy group-hover:text-brand-green-600">{aboutData?.phone ?? '+233 55 427 3445'}</span>
                    </span>
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SERVICES ================= */}
      <section className="bg-mist py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What We Offer"
            title="Our Services"
            subtitle="Comprehensive procurement solutions tailored to meet your business needs — delivered with precision."
          />
          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {(servicesLive ?? services).map((s) => (
              <motion.div key={s.title} variants={staggerChild}>
                <Link
                  to={`/services?highlight=${s.slug}`}
                  className="card-hover group block h-full rounded-3xl border border-gray-100 bg-white p-8 shadow-soft"
                >
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 text-navy transition-all duration-300 group-hover:bg-navy group-hover:text-gold-400">
                    <s.icon size={26} strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-6 font-display text-lg font-bold text-navy">{s.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink-light">{s.desc}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green-600 transition-all duration-300 group-hover:gap-2.5">
                    Learn More <ArrowRight size={15} />
                  </span>
                </Link>
              </motion.div>
            ))}

            {/* CTA tile fills grid */}
            <motion.div variants={staggerChild}>
              <Link
                to="/quote"
                className="card-hover group relative flex h-full min-h-[240px] flex-col justify-between overflow-hidden rounded-3xl bg-navy p-8"
              >
                <QuoteIcon size={26} className="text-gold-400" />
                <div className="relative">
                  <h3 className="font-display text-xl font-bold text-white">Need something specific?</h3>
                  <p className="mt-2 text-[15px] text-navy-100/80">
                    Request a custom quote — we source anything your business needs.
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 font-semibold text-gold-400 transition-all group-hover:gap-3">
                    Get a Quote <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================= INDUSTRIES ================= */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Who We Serve"
            title="Industries We Serve"
            subtitle="Trusted by organisations across diverse sectors in Ghana and West Africa."
          />
          <motion.ul
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-2 gap-5 md:grid-cols-4"
          >
            {(liveIndustries ?? industries).map((ind) => (
              <motion.li key={ind.name} variants={staggerChild}>
                <Link
                  to={`/industries?highlight=${(ind as { slug: string }).slug}`}
                  className="card-hover group flex h-full flex-col items-center rounded-3xl border border-gray-100 bg-mist px-6 py-9 text-center hover:border-navy-200 hover:bg-navy"
                >
                  <ind.icon
                    size={38}
                    strokeWidth={1.5}
                    className="text-navy transition-colors duration-300 group-hover:text-gold-400"
                  />
                  <p className="mt-4 font-display text-[15px] font-bold text-navy transition-colors duration-300 group-hover:text-white">
                    {ind.name}
                  </p>
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </section>

      {/* ================= WHY CHOOSE US ================= */}
      <section className="relative overflow-hidden bg-navy py-24 md:py-32">
        <div
          className="absolute right-[-200px] top-[-200px] h-[520px] w-[520px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, #235088, transparent)' }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            dark
            eyebrow="Why GNAB"
            title="Why Choose GNAB"
            subtitle="We go beyond supply — we become your strategic procurement partner."
          />
          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {(liveWhy ?? whyUs).map((item) => (
              <motion.div key={item.title} variants={staggerChild}>
                <Link
                  to="/why-us"
                  className="card-hover group block h-full rounded-3xl border border-white/10 bg-white/[0.06] p-8 backdrop-blur-sm hover:border-gold-400/40 hover:bg-white/[0.09]"
                >
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-400 ring-1 ring-gold-400/25 transition-transform duration-300 group-hover:scale-110">
                    <item.icon size={26} strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-6 font-display text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-navy-100/75">{item.desc}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-400 transition-all duration-300 group-hover:gap-2.5">
                    Explore <ArrowRight size={15} />
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================= PROCESS — premium corporate ================= */}
      <section className="relative bg-mist py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white/60" aria-hidden />
        <div className="absolute left-1/2 top-0 h-px w-[70%] max-w-4xl -translate-x-1/2 bg-gradient-to-r from-transparent via-gold-400/20 to-transparent" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="How It Works"
            title="Our Procurement Process"
            subtitle="A streamlined six-step journey designed for clarity, speed and trust — managed by one dedicated partner."
          />

          {/* Premium desktop — 3 columns, cards with gold top border */}
          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="hidden gap-6 lg:grid lg:grid-cols-3"
          >
            {(liveSteps ?? steps).map((step) => (
              <motion.div key={step.num} variants={staggerChild}>
                <Link to="/process" className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-gray-100 bg-white p-7 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-navy-100 hover:shadow-lift">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold-400 via-amber-400 to-gold-400 opacity-90" aria-hidden />
                  <div className="absolute -right-4 -top-4 select-none font-display text-6xl font-extrabold leading-none text-navy/[0.04]" aria-hidden>
                    {step.num}
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-amber-500 font-display text-sm font-extrabold text-navy shadow-md">
                        {step.num}
                      </span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy transition-colors duration-300 group-hover:bg-navy group-hover:text-gold-400">
                        <step.icon size={18} strokeWidth={1.8} />
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-lg font-bold leading-tight text-navy">{step.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-ink-light">{step.desc}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green-600 opacity-0 transition-all duration-300 group-hover:gap-2 group-hover:opacity-100">
                      Explore process <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Premium mobile — vertical with gold rail */}
          <div className="relative lg:hidden">
            <div className="absolute bottom-4 left-6 top-4 w-px bg-gradient-to-b from-gold-400/60 via-gold-400/20 to-transparent" aria-hidden />
            <ol className="relative space-y-5">
              {(liveSteps ?? steps).map((step) => (
                <motion.li key={step.num} variants={staggerChild} initial="hidden" whileInView="show" viewport={{ once: true }} className="relative flex gap-4">
                  <span className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-amber-500 font-display text-xs font-extrabold text-navy shadow-md ring-4 ring-mist">
                    {step.num}
                  </span>
                  <Link to="/process" className="group flex-1 overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-soft transition-all hover:border-navy-100 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy">
                        <step.icon size={14} strokeWidth={1.8} />
                      </span>
                      <h3 className="font-display text-base font-bold text-navy">{step.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink-light">{step.desc}</p>
                  </Link>
                </motion.li>
              ))}
            </ol>
          </div>

          <div className="mt-12 text-center">
            <ButtonLink to="/process" variant="outlineNavy">
              View Full Process <ArrowRight size={16} />
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="relative overflow-hidden bg-gradient-to-r from-brand-green-600 via-brand-green-500 to-emerald-600 py-20">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
            {(statsLive ?? stats).map((s) => (
              <Reveal key={s.label} className="text-center">
                <p className="font-display text-5xl font-extrabold text-white md:text-6xl">
                  <Counter value={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-2 text-sm font-medium uppercase tracking-[0.14em] text-white/85">{s.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="bg-mist py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Testimonials"
            title="What Our Clients Say"
          />
          <div className="relative min-h-[240px]">
            <AnimatePresence mode="wait">
              <motion.figure
                key={reviews[testimonial]?.id ?? testimonial}
                initial={reduce ? undefined : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -20 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-[28px] border border-gray-100 bg-white p-10 shadow-soft md:p-12"
              >
                <QuoteIcon size={36} className="mx-auto mb-6 text-gold-400" />
                <blockquote className="text-lg leading-relaxed text-ink md:text-xl">
                  &ldquo;{reviews[testimonial]?.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-8">
                  <p className="font-display font-bold text-navy">{reviews[testimonial]?.client_name}</p>
                  <p className="mt-1 text-sm text-ink-light">{reviews[testimonial]?.company}</p>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>
          <div className="mt-8 flex justify-center gap-2.5">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setTestimonial(i)}
                aria-label={`Testimonial ${i + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === testimonial ? 'w-9 bg-brand-green-500' : 'w-2.5 bg-navy-200 hover:bg-navy-300'
                }`}
              />
            ))}
          </div>
          <div className="mt-10">
            <ButtonLink to="/testimonials" variant="outlineNavy">
              Share Your Experience
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ================= CTA — premium feature card ================= */}
      <section className="bg-mist py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className={`relative overflow-hidden rounded-[32px] p-[1.5px] shadow-lift ${ctaTheme.outer}`}>
              <div className={`relative overflow-hidden rounded-[30px] ${ctaTheme.inner}`}>
                <img src={ctaData?.bg_image_url ?? ctaBg ?? IMAGES.logistics} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.07]" aria-hidden />
                <div className={`absolute -right-32 -top-32 h-96 w-96 rounded-full blur-3xl ${ctaTheme.orbA}`} aria-hidden />
                <div className={`absolute -bottom-32 -left-32 h-96 w-96 rounded-full blur-3xl ${ctaTheme.orbB}`} aria-hidden />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/40 to-transparent" aria-hidden />
                <div className={`relative p-10 md:p-14 ${ctaCentered ? 'text-center' : 'text-left'}`}>
                  <span className={`mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-400 text-navy shadow-lg shadow-gold-500/25 ${ctaCentered ? 'mx-auto' : ''}`}>
                    <Clock size={28} />
                  </span>
                  <Eyebrow text={ctaData?.eyebrow ?? "Let's talk"} style={settings.cta_eyebrow_style || 'pill'} />
                  <h2 className={`${titleSizeClass(ctaTitleSize, 'cta')} ${ctaCentered ? '' : '!mx-0 text-left'}`}>
                    {ctaData?.title_prefix ?? 'Ready to Simplify'} <span className="text-gradient-gold">{ctaData?.title_highlight ?? 'Your Procurement?'}</span>
                  </h2>
                  <p className={`mt-6 max-w-2xl text-lg leading-relaxed text-navy-100/80 ${ctaCentered ? 'mx-auto' : ''}`}>
                    {ctaData?.subtitle ?? 'Let GNAB handle your sourcing, pricing and delivery — one partner, endless solutions. Your free quotation lands within 24 hours.'}
                  </p>
                  <div className={`mt-10 flex flex-col gap-4 sm:flex-row ${ctaCentered ? 'items-center justify-center' : 'items-start justify-start'}`}>
                    <ButtonLink to={ctaData?.primary_link ?? '/quote'} variant="gold" size="lg">
                      {ctaData?.primary_label ?? 'Request a Quote'} <ArrowRight size={18} />
                    </ButtonLink>
                    <ButtonLink to={ctaData?.secondary_link ?? '/contact'} variant="outlineLight" size="lg">
                      {ctaData?.secondary_label ?? 'Contact Our Team'}
                    </ButtonLink>
                  </div>
                  <div className={`mt-12 flex max-w-xl flex-wrap gap-6 border-t border-white/10 pt-8 text-sm ${ctaCentered ? 'mx-auto items-center justify-center' : 'items-center justify-start'}`}>
                    <span className="inline-flex items-center gap-2 font-medium text-white/90"><span className="h-2 w-2 animate-pulse rounded-full bg-green-400" /> {ctaData?.feature1 ?? '24h response'}</span>
                    <span className="hidden h-4 w-px bg-white/10 sm:block" aria-hidden />
                    <span className="font-medium text-navy-100/70">{ctaData?.feature2 ?? '100% commitment'}</span>
                    <span className="hidden h-4 w-px bg-white/10 sm:block" aria-hidden />
                    <span className="font-medium text-navy-100/70">{ctaData?.feature3 ?? 'No obligation until you approve'}</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
